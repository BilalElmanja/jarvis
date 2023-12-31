import {
  PineconeClient,
  Vector,
  utils as PineconeUtils,
} from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};
let pinecone: PineconeClient | null = null;

export const getPineConeClient = async () => {
  if (!pinecone) {
    pinecone = new PineconeClient();
    await pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pinecone;
};

export async function loadS3IntoPinecone(file_key: string) {
  // 1. obtain the pdf -> download and read from pdf
  console.log("downloading from s3 into filesystem");
  const file_name = await downloadFromS3(file_key);
  if (!file_name) {
    throw new Error("could not download file from s3");
  }
  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];

  // 2. split and segment the pdf
  const documents = await Promise.all(pages.map(prepareDocument));

  // 3. vectorise and embed individual documents
  const vectors = await Promise.all(documents.flat().map(embedDocument));

  // 4. upload to pinecone
  const client = await getPineConeClient();
  const pineconeIndex = client.Index("jarvis");
  console.log("inserting vectors in pinecone");
  const namespace = convertToAscii(file_key);
  PineconeUtils.chunkedUpsert(pineconeIndex, vectors, namespace, 10);
  return documents[0];
}

// async function embedDocument
async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);
    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as Vector;
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, numBytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, numBytes));
};

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, " ");
  // split the docs
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);

  return docs;
}
