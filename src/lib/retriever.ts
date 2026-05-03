import { QdrantVectorStore } from "@langchain/qdrant";
import { OllamaEmbeddings } from "@langchain/ollama";

export async function getRetriever(options: { k?: number } = {}) {
    const embeddings = new OllamaEmbeddings({
        model: "embeddinggemma",
        baseUrl: "http://localhost:11434",
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
            url: "http://localhost:6333",
            collectionName: "documents",
        }
    );

    return vectorStore.asRetriever({ k: options.k || 4 });
}