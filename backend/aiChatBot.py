# Code Credit for AI API Web Connection: Daky
# Code Credit for Loading Compressed CSV file and Normalizing null values: Jaspinder

import sys
import os
import google.generativeai as genai
from typing import List, Dict, Any

# Get the path to the backend directory
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Add the backend directory to the system path
sys.path.append(parent_dir)

# ==== SOILA : UPDATE HOW QUERY_DB module is being imported ==== #
import query_db

# --- API Key & Model Configuration ---
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# Initialise constants
TOP_N = 100
THRESHOLD = 0.3

# We will remove load_compressed_txt_ and normalize_null_values as they are not used
# in the API route's primary logic.

# The `batch_comments` function remains useful and can be kept as is.
def batch_comments(comments: List[str], batch_size: int) -> List[List[str]]:
    """Breaks comments into smaller chunks for processing."""
    batches = []
    for i in range(0, len(comments), batch_size):
        batch = comments[i:i + batch_size]
        batches.append(batch)
    return batches

# These prompt generation functions can be kept as is.
def create_batch_summary_prompt(comments_batch: List[str]) -> str:
    """Generates a detailed prompt to instruct the Gemini model to summarize a batch."""
    prompt_persona = "You are an expert content analyst specializing in synthesizing information from Reddit discussions."
    prompt_task = "Your task is to analyze and summarize a batch of Reddit comments related to gout. Your summary should be comprehensive but concise."
    prompt_guidelines = """
Follow these specific guidelines for your summary:
1. **Identify Key Themes**: Group comments that discuss similar topics (e.g., diet, medications, flare-up triggers, personal experiences).
2. **Highlight Consensus and Dissent**: Note any common advice, widely-held beliefs, or conflicting opinions.
3. **Extract Actionable Advice**: Pull out specific tips or recommendations that users have shared.
4. **Maintain Neutrality**: Do not add your own opinions or conclusions. Stick strictly to the information provided in the comments.
5. **Use Markdown**: Format the summary using bullet points or subheadings to make it easy to read.

Below is the batch of comments you must summarize. Do not include any other text in your response, just the summary.
"""
    formatted_comments = "\n".join([f"Comment {i+1}: {comment}" for i, comment in enumerate(comments_batch)])
    final_prompt = f"{prompt_persona}\n\n{prompt_task}\n\n{prompt_guidelines}\n\n---\n\n{formatted_comments}"
    return final_prompt

def create_final_summary_prompt(summaries: List[str]) -> str:
    """Generates a prompt to instruct the Gemini model to synthesize multiple summaries into one."""
    prompt = "You are a content synthesis expert. Your task is to combine the following individual summaries of Reddit comments on Gout into a single, comprehensive, and well-structured summary. Focus on identifying and combining recurring themes, advice, and questions. The final summary should be easy to read and provide a holistic overview of the discussions."
    prompt += "\n\nHere are the individual summaries to be combined:\n\n"
    for i, summary in enumerate(summaries):
        prompt += f"Summary {i+1}:\n{summary}\n\n"
    prompt += "Do not include any other text, explanations, or conversational phrases in your final response. Just provide the comprehensive summary."
    return prompt

def create_client_content_prompt(task: str, final_summary: str, order_criteria: str) -> str:
    """Generates a prompt to instruct the Gemini model to create content based on the client's request."""
    prompt_intro = "You are a professional content creator. Your goal is to generate high-quality content based on provided context."
    prompt_task = f"Your task is to: {task}."
    prompt_context = "Use the following comprehensive summary of a Reddit discussion to inform your content. The content should be well-written, engaging, and directly relevant to the themes and topics in the summary."
    if order_criteria == "top":
        prompt_context += " Emphasize the most popular or frequently mentioned points from the discussion."
    elif order_criteria == "recent":
        prompt_context += " Focus on the most up-to-date information and trends found in the discussion."
    prompt_summary = f"Here is the comprehensive summary:\n\n{final_summary}"
    prompt_ending = "Do not include any other text, explanations, or conversational phrases. Just provide the final content."
    final_prompt = f"{prompt_intro}\n\n{prompt_task}\n\n{prompt_context}\n\n{prompt_summary}\n\n{prompt_ending}"
    return final_prompt

# This function is the new entry point for your FastAPI route.
# It orchestrates all the steps your old main() function performed.
async def process_user_request(user_prompt: str, user_task: str) -> Dict[str, Any]:
    """
    Main function to process a client request from start to finish.
    It fetches relevant data, summarizes it, and generates final content.
    """
    print(f"🔄 Processing user prompt: '{user_prompt}' with task: '{user_task}'")
    
     # --- Determine order_criteria from user prompt ---
    prompt_lower = user_prompt.lower()
    if "most popular" in prompt_lower or "frequently mentioned" in prompt_lower:
        order_criteria = "top"
    elif "latest" in prompt_lower or "recent" in prompt_lower or "new" in prompt_lower:
        order_criteria = "recent"
    else:
        order_criteria = "default"
    print(f"ℹ️ Determined order_criteria: {order_criteria}")
    
    # Step 1: Fetch relevant data from the vector database
    try:
        relevant_comments_dict = await query_db.find_most_similar_painpoints(user_prompt)
        relevant_comments = [item['content'] for item in relevant_comments_dict]
        
        if not relevant_comments:
            return {"error": "No relevant comments found in the database."}
        print(f"✅ Found {len(relevant_comments)} relevant comments.")
    except Exception as e:
        print(f"❌ Error fetching from vector DB: {e}")
        return {"error": "Failed to retrieve data from the database."}
        
    # Steps 2 & 3: Batch summarization
    batch_size = 80
    batch_summaries = []
    comment_batches = batch_comments(relevant_comments, batch_size)
    
    for i, batch in enumerate(comment_batches):
        print(f"Processing batch {i+1} of {len(comment_batches)}...")
        prompt = create_batch_summary_prompt(batch)
        try:
            response = await model.generate_content(prompt)
            batch_summaries.append(response.text)
        except Exception as e:
            print(f"⚠️ Error summarizing batch {i+1}: {e}")
            continue

    if not batch_summaries:
        return {"error": "Failed to generate any batch summaries."}
        
    print("✅ All batches summarized.")

    # Steps 4 & 5: Generate final comprehensive summary
    final_summary_prompt = create_final_summary_prompt(batch_summaries)
    try:
        final_summary_response = await model.generate_content(final_summary_prompt)
        final_summary = final_summary_response.text
        print("✅ Final comprehensive summary generated.")
    except Exception as e:
        print(f"❌ Error generating final summary: {e}")
        return {"error": "Failed to generate a final summary."}

    # Steps 6 & 7: Generate final content requested by the user
    # Note: 'default' is used as a placeholder for order_criteria since the `process_user_request` function
    # currently does not extract it from the prompt.
    final_content_prompt = create_client_content_prompt(user_task, final_summary, order_criteria)
    try:
        final_content_response = await model.generate_content(final_content_prompt)
        final_content = final_content_response.text
        print("✅ Final content generated for client.")
        return {"summary": final_content}
    except Exception as e:
        print(f"❌ Error generating final content: {e}")
        return {"error": "Failed to generate the final content."}

    # Length: 200 comments Gemini - 80 comments
    # 1. Break down the comments into batches 
    # 2. Create a function to generate a prompt to send to the Gemini model to generate a summary of the comments in the batch
    #       - Pass the batch of comments to the function you create
    #       - Reference this function: create_task_breakdown_prompt
    # 3. Create another function to call the Gemini model 
    #       - Loop through each batch
    #       - Pass the batch to the function created to generate the prompt
    #       - Pass the prompt to the Gemini model (call the prompt function from Step 2)
    #       - Receive the summary/response from the Gemini model
    #       - Save the summary in an array 
    #       - Reference this function: process_client_request_with_websocket
    # 4. Create a function to generate a prompt to send to the Gemini model to generate the final comprehensive (condensed) summary of the provided summaries
    # 5. Create another function to call the Gemini model
    #       - Pass the prompt from Step 4 to the Gemini model (call the prompt function from Step 4)
    #       - Receive final summary from the Gemini model
    #       - Return the final summary
    # 6. Create a function to generate a prompt to send to the Gemini model to generate the content requested by the client
    #       - Task e.g. Generate email. To access the task, call result.get("task")
    #       - Final comprehensive summary from Step 5
    # 7. Create another function to call the Gemini model to generate the content
    #       - Pass the prompt from Step 6 by calling the function
    #       - Receive the final respoinse from the Gemini model
    #       - Return the final content (this will be displayed on the frontend, just return it for now)
