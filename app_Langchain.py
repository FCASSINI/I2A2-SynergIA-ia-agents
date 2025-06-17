import os
import streamlit as st
import pandas as pd
from langchain.agents import create_csv_agent
from langchain.chat_models import ChatOpenAI
from zipfile import ZipFile
import shutil


st.set_page_config(page_title="CSV QA (OpenAI)", layout="centered")

#Load OpenAI Chat Model
@st.cache_resource
def load_openai_model():
return ChatOpenAI(
model="gpt-4",
temperature=0.3,
openai_api_key=os.getenv("OPENAI_API_KEY"),
)
llm = load_openai_model()

# --- UI ---
st.title("📊 Ask Questions About Your CSV (OpenAI)")
uploaded_file = st.file_uploader("Upload a CSV or ZIP file", type=["csv", "zip"])
def extract_csv_from_zip(zip_file, extract_path="extracted_files"):
if os.path.exists(extract_path):
shutil.rmtree(extract_path)
os.makedirs(extract_path, exist_ok=True)
with ZipFile(zip_file, 'r') as zip_ref:
    zip_ref.extractall(extract_path)

return [f for f in os.listdir(extract_path) if f.endswith(".csv")], extract_path
if uploaded_file:
ext = uploaded_file.name.split(".")[-1]
csv_path = None
if ext == "zip":
    with open("temp.zip", "wb") as f:
        f.write(uploaded_file.getbuffer())

    csv_files, folder = extract_csv_from_zip("temp.zip")
    if not csv_files:
        st.error("❌ No CSV found in the ZIP.")
    else:
        selected_csv = st.selectbox("Choose a CSV file:", csv_files)
        csv_path = os.path.join(folder, selected_csv)

else:
    csv_path = "uploaded.csv"
    with open(csv_path, "wb") as f:
        f.write(uploaded_file.getbuffer())

if csv_path:
    df = pd.read_csv(csv_path)
    st.subheader("📄 File Preview")
    st.dataframe(df.head())

    question = st.text_input("Ask a question:")

    if question:
        with st.spinner("Thinking..."):
            try:
                agent = create_csv_agent(
                    llm,
                    csv_path,
                    verbose=True,
                    handle_parsing_errors=True,
                )
                answer = agent.run(question)
                st.success("Answer:")
                st.write(answer)
            except Exception as e:
                st.error(f"❌ Error: {e}")
download_model.py — Optional if using OpenAI (not needed), but example if using local LLM
If you were using a local model (like Mistral), you'd use:
from huggingface_hub import snapshot_download
snapshot_download(
repo_id="TheBloke/Mistral-7B-Instruct-v0.2-GGUF",
allow_patterns="*.gguf",
local_dir="local_models/mistral",
)

