"use client";
import { uploadToS3 } from "@/lib/s3";
import { Inbox, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const FileUpload = () => {
  const router = useRouter();
  const [Uploading, setUploading] = React.useState(false);

  const { mutate } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });

      return response.data;
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "appkication/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      console.log(acceptedFiles);
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large");
        alert("File must be less than 10MB");
        return;
      }
      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if (!data?.file_key || !data?.file_name) {
          toast.error("Soemthing went wrong");
          alert("Error uploading file");
          return;
        }
        mutate(data, {
          onSuccess: ({ chat_id }) => {
            toast.success("chat has been created");
            router.push("/chat/" + chat_id);
          },
          onError: (error) => {
            toast.error("Error creating chat");
            console.log(error);
          },
        });
        console.log("data :", data);
      } catch (error) {
        console.log(error);
      } finally {
        setUploading(false);
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
        {Uploading ? (
          <>
            <Loader2 className="w-12 h-12 text-blue-500" />
            <p className="mt-2 text-sm text-slate-600">Uploading...</p>
          </>
        ) : (
          <>
            <Inbox className="w-12 h-12 text-blue-500" />
            <p className="mt-2 text-sm text-slate-600">
              Drag and drop your file here
            </p>
          </>
        )}
        <></>
      </div>
    </div>
  );
};

export default FileUpload;
