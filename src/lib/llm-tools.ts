import { tool } from "langchain";
import z from "zod";
import { getRetriever } from "./retriever";

const searchKnowledgeBaseSchema = z.object({
  query: z.string().describe("Searching words or questions that want to searching data such aswhat mental health is, what its key components and importance are, how to recognize warning signs like persistent sadness or behavioral changes, and what practical strategies—such as exercise, sleep, mindfulness, and social support—can improve overall mental well-being.")
});

/**
 * Tool: search_knowledge_base (RAG)
 * Search data from Knowledge Base (Qdrant Vector Database)
 *
 * Dependencies:
 * - Qdrant: must run at port 6333
 * - Ollama: must run at port 11434 with embeddinggemma model
 * - Must index documents before pass /api/rag-index
 */
export const searchKnowledgeBaseTool = tool(
  async ({ query }): Promise<string> => {
    try {
      console.log('[Tool] searchKnowledgeBase called with query:', query);

      // Creates retriever for searching data from Qdrant
      const retriever = await getRetriever({ k: 4 }); // Retrieves 4 documents that mostly relate with

      // Searches documents that relates with query
      const relevantDocs = await retriever.invoke(query);

      console.log('[Tool] Found', relevantDocs.length, 'relevant documents');

      if (relevantDocs.length === 0) {
        return JSON.stringify({
          status: "NOT_FOUND",
          message: "Not found data that relate with Knowledge Base"
        });
      }

      // Gathers content from documents founed
      const results = relevantDocs.map((doc, index) => {
        // Retrieves file name from path
        const source = doc.metadata?.source || "unknown";
        const fileName = source.split('/').pop() || source;

        return {
          index: index + 1,
          source: fileName,
          content: doc.pageContent
        };
      });

      return JSON.stringify({
        status: "SUCCESS",
        query: query,
        totalResults: results.length,
        results: results
      });

    } catch (error) {
      console.error('[Tool] Error in searchKnowledgeBase:', error);
      return JSON.stringify({
        status: "ERROR",
        message: "Have some error in searching Knowledge Base. Please check your Qdrant and Ollama are available",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  {
    name: "search_knowledge_base",
    description: `Searching data from Knowledge base from database - when user ask about:
    - Mental health
    - Key aspects
    - Warning Signs
    - Improve mental health and Key Strategies to improve
    - Statistics of mental health

    must send query like keywords or clear questions
    Examples:
    -  search_knowledge_base(query="What is mental health?")
    -  search_knowledge_base(query="How to improve mental health?")
    -  search_knowledge_base(query="How many people die from mental health issues?")
    `,
    schema: searchKnowledgeBaseSchema
  }
);