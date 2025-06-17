import streamlit as st
import os
import pandas as pd

from zipfile import ZipFile
from langchain.llms import OpenAI
from langchain_experimental.agents import create_csv_agent

# Set Streamlit config first
st.set_page_config(page_title="ZIP CSV Q&A", layout="centered")

# --- UI ---
st.title("🗂️ Ask Questions from a CSV inside a ZIP")

uploaded_zip = st.file_uploader("Upload a .ZIP file containing CSV(s)", type="zip")

def unzip_and_list(zip_file, extract_path="unzipped"):
    with ZipFile(zip_file, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
    return [f for f in os.listdir(extract_path) if f.endswith('.csv')], extract_path

if uploaded_zip:
    # Save and unzip
    zip_path = "uploaded.zip"
    with open(zip_path, "wb") as f:
        f.write(uploaded_zip.getbuffer())
    csv_files, folder = unzip_and_list(zip_path)

    if csv_files:
        csv_choice = st.selectbox("Select a CSV file to explore", csv_files)
        selected_csv_path = os.path.join(folder, csv_choice)
        df = pd.read_csv(selected_csv_path)
        st.dataframe(df.head())

        question = st.text_input("Ask a question about the data:")

        if question:
            with st.spinner("Thinking..."):
                # Set up the LangChain agent
                llm = OpenAI(
					temperature=0,
					openai_api_key="OPENAI_API_KEY")
                agent = create_csv_agent(
					llm,
					selected_csv_path,
					verbose=True,
					allow_dangerous_code=True,
					handle_parsing_errors=True
				)
                try:
                    answer = agent.run(question)
                    st.success("✅ Answer:")
                    st.write(answer)
                except Exception as e:
                    st.error(f"❌ Error: {e}")
    else:
        st.warning("No CSV files found in the ZIP.")