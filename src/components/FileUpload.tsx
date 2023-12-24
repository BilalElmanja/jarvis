"use client";
import { uploadToS3 } from "@/lib/s3";
import { Inbox } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";

const FileUpload = () => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "appkication/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      console.log(acceptedFiles);
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        alert("File must be less than 10MB");
        return;
      }
      try {
        const data = await uploadToS3(file);
        console.log("data :", data);
      } catch (error) {
        console.log(error);
      }
    },
  });

  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        <>
          <Inbox className="w-12 h-12 text-blue-500" />
          <p className="mt-2 text-lg text-slate-600">
            Drag and drop your file here
          </p>
        </>
      </div>
    </div>
  );
};

export default FileUpload;
