/**
 * RAG Document Indexing API
 * =========================
 * API Endpoint: GET /api/rag-index
 * URL: http://localhost:4000/api/rag-index
 *
 * หน้าที่: อ่านเอกสารจากโฟลเดอร์ ./data แล้วแปลงเป็น Vector Embeddings
 *         เก็บลงใน Qdrant Vector Database เพื่อใช้ในระบบ RAG (Retrieval-Augmented Generation)
 *
 * ขั้นตอนการทำงาน:
 * 1. โหลดเอกสารจากโฟลเดอร์ ./data (รองรับ .txt, .csv, .pdf, .docx)
 * 2. แบ่งเอกสารเป็น chunks ย่อยๆ ด้วย RecursiveCharacterTextSplitter
 * 3. สร้าง Embeddings ด้วย Ollama (model: embeddinggemma)
 * 4. บันทึก Vector ลงใน Qdrant Database
 */

// ============================================================
// Document Loaders - ใช้โหลดเอกสารประเภทต่างๆ
// ============================================================
import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory"; // โหลดไฟล์ทั้งหมดในโฟลเดอร์
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";           // โหลดไฟล์ .txt
// import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";        // โหลดไฟล์ .csv
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";        // โหลดไฟล์ .pdf (ต้องติดตั้ง pdf-parse)
// import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";      // โหลดไฟล์ .docx (ต้องติดตั้ง mammoth)

// ============================================================
// Text Splitter - ใช้แบ่งเอกสารเป็น chunks
// ============================================================
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// ============================================================
// Vector Store & Embeddings - ใช้สร้างและเก็บ Vector
// ============================================================
import { QdrantVectorStore } from "@langchain/qdrant";   // Vector Database (ต้องรัน Qdrant ที่ port 6333)
import { OllamaEmbeddings } from "@langchain/ollama";    // Embedding Model จาก Ollama (ต้องรัน Ollama ที่ port 11434)
// import { QdrantClient } from "@qdrant/js-client-rest"; // Qdrant Client สำหรับจัดการ collection โดยตรง

import { NextResponse } from "next/server";

/**
 * GET /api/rag-index
 * ทำการ Index เอกสารทั้งหมดลงใน Vector Database
 */
export async function POST() {
    // ============================================================
    // (Optional) ลบ Collection เก่าก่อน Index ใหม่
    // ============================================================
    // เปิดใช้งานเมื่อต้องการล้างข้อมูลเก่าทั้งหมดก่อน index ใหม่
    // หากไม่เปิด ข้อมูลใหม่จะถูกเพิ่มเข้าไปใน collection เดิม (อาจมีข้อมูลซ้ำ)
    //
    // const qdrantClient = new QdrantClient({
    //     url: process.env.QDRANT_URL || "http://localhost:6333"
    // });
    // await qdrantClient.deleteCollection("documents").catch(() => {
    //     // ไม่ error ถ้า collection ไม่มีอยู่
    //     console.log("Collection 'documents' not found, creating new one...");
    // });

    // ============================================================
    // Step 1: โหลดเอกสารจากโฟลเดอร์ ./data
    // ============================================================
    // DirectoryLoader จะอ่านไฟล์ทั้งหมดในโฟลเดอร์ที่กำหนด
    // โดยใช้ Loader ที่เหมาะสมตามนามสกุลไฟล์
    const rawDocs = await new DirectoryLoader("./data", {
        ".txt": (path: string) => new TextLoader(path),      // ไฟล์ .txt ใช้ TextLoader
        // ".csv": (path: string) => new CSVLoader(path),    // ไฟล์ .csv ใช้ CSVLoader
        // ".pdf": (path: string) => new PDFLoader(path),    // ไฟล์ .pdf ใช้ PDFLoader
        // ".docx": (path: string) => new DocxLoader(path),  // ไฟล์ .docx ใช้ DocxLoader
    }).load();

    // ============================================================
    // Step 2: แบ่งเอกสารเป็น Chunks ย่อยๆ
    // ============================================================
    // RecursiveCharacterTextSplitter จะแบ่งข้อความโดย:
    // - chunkSize: ขนาดสูงสุดของแต่ละ chunk (300 ตัวอักษร)
    // - chunkOverlap: จำนวนตัวอักษรที่ซ้อนทับกันระหว่าง chunks (40 ตัวอักษร)
    //   เพื่อไม่ให้ข้อมูลขาดหายตรงจุดตัด
    // - separators: ตัวคั่นที่ใช้แบ่ง (ในที่นี้คือ ขึ้นบรรทัดใหม่)
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 40,
        separators: ["\n"]
    });

    // แบ่งเอกสารทั้งหมดเป็น chunks
    const chunks = await splitter.splitDocuments(rawDocs);

    // ============================================================
    // Step 3: สร้าง Embedding Model
    // ============================================================
    // OllamaEmbeddings ใช้ Ollama เพื่อแปลงข้อความเป็น Vector
    // - model: ชื่อ embedding model ที่จะใช้ (ต้อง ollama pull embeddinggemma ก่อน)
    // - baseUrl: URL ของ Ollama server
    const embeddings = new OllamaEmbeddings({
        model: "embeddinggemma",
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    });

    // ============================================================
    // Step 4: บันทึก Vectors ลงใน Qdrant Database
    // ============================================================
    // QdrantVectorStore.fromDocuments() จะ:
    // 1. แปลง chunks เป็น vectors โดยใช้ embeddings model
    // 2. บันทึก vectors พร้อมข้อมูลต้นฉบับลงใน Qdrant
    //
    // Parameters:
    // - chunks: เอกสารที่แบ่งเป็น chunks แล้ว
    // - embeddings: model ที่ใช้สร้าง embeddings
    // - url: URL ของ Qdrant server (ต้องรัน docker run -p 6333:6333 qdrant/qdrant)
    // - collectionName: ชื่อ collection ที่จะเก็บข้อมูล
    await QdrantVectorStore.fromDocuments(
        chunks,
        embeddings,
        {
            url: process.env.QDRANT_URL || "http://localhost:6333",
            collectionName: "documents",
        }
    );

    // ============================================================
    // Step 5: ส่งผลลัพธ์กลับ
    // ============================================================
    return NextResponse.json({
        message: `ทำ Indexed ${chunks.length} chunks`
    });
}