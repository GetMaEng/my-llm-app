import { tool } from "langchain";
import z from "zod";
import { getRetriever } from "./retriever";

const searchKnowledgeBaseSchema = z.object({
  query: z.string().describe("Searching words or questions that want to searching data such aswhat mental health is, what its key components and importance are, how to recognize warning signs like persistent sadness or behavioral changes, and what practical strategies—such as exercise, sleep, mindfulness, and social support—can improve overall mental well-being.")
});

/**
 * Tool: search_knowledge_base (RAG)
 * ค้นหาข้อมูลจาก Knowledge Base (Qdrant Vector Database)
 * ใช้สำหรับตอบคำถามเกี่ยวกับ: นโยบายการลา, สวัสดิการ, ระเบียบบริษัท, ข้อมูลสินค้า
 *
 * Dependencies:
 * - Qdrant: ต้องรันที่ port 6333
 * - Ollama: ต้องรันที่ port 11434 พร้อม embeddinggemma model
 * - ต้อง index documents ก่อนผ่าน /api/rag-index
 */
export const searchKnowledgeBaseTool = tool(
  async ({ query }): Promise<string> => {
    try {
      console.log('[Tool] searchKnowledgeBase called with query:', query);

      // สร้าง retriever เพื่อค้นหาข้อมูลจาก Qdrant
      const retriever = await getRetriever({ k: 4 }); // ดึง 4 documents ที่เกี่ยวข้องที่สุด

      // ค้นหา documents ที่เกี่ยวข้องกับ query
      const relevantDocs = await retriever.invoke(query);

      console.log('[Tool] Found', relevantDocs.length, 'relevant documents');

      if (relevantDocs.length === 0) {
        return JSON.stringify({
          status: "NOT_FOUND",
          message: "Not found data that relate with Knowledge Base"
        });
      }

      // รวม content จาก documents ที่พบ
      const results = relevantDocs.map((doc, index) => {
        // ดึงชื่อไฟล์จาก path
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