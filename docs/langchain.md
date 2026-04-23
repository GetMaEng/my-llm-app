## What is LangChain

**LangChain** is an open-source framework designed to simplify the development of applications using Large Language Models (LLMs) such as OpenAI's GPT, Google's Gemini, or Anthropic's Claude. 

# Core Modules

LangChain offers components that developers can combine to create complex workflows:

- **Chains:** Sequences of automated actions where the output of one step becomes the input for the next.
- **Agents:** Systems that use an LLM as a "reasoning engine" to determine actions or tools to use to complete a task.
- **Retrieval-Augmented Generation (RAG):** Components that connect LLMs to external, up-to-date data sources to reduce hallucinations and improve accuracy.
- **Memory:** Utilities that allow applications to remember past interactions, which is essential for maintaining context in long-running conversations.
- **Prompt Templates:** Pre-built structures that help developers format and manage instructions for various models.

# Why Use LangChain

- **Model Agnosticism:** Developers can switch between different LLM providers with minimal code changes.
- **Efficiency:** It provides pre-built components for common AI tasks, reducing the manual code needed to build applications.
- **Integration Ecosystem:** It has over 1,000 integrations with various tools, databases, and model providers.

# 1. Install LangChain

To install the LangChain package:

```bash
npm install langchain @langchain/core
# Requires Node.js 20+
```

LangChain provides integrations to hundreds of LLMs and thousands of other integrations. These live in independent provider packages. In this project, we use Ollama (Download from [ollama.com](https://ollama.com/download/windows))

To install the Ollama Integration

```bash
npm install @langchain/ollama
```