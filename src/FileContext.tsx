import {
  type FC,
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
  useRef,
  FormEvent,
} from "react";
import { set, useForm } from "react-hook-form";
import { convertFile, downloadFile, loadFfmpeg } from "./lib/utils";
import type { FFmpeg } from "@ffmpeg/ffmpeg";

export enum FileStatus {
  Ready = "ready",
  Converting = "converting",
  Converted = "converted",
  Error = "error",
  Downloaded = "downloaded",
}

export type FileData = {
  fileObj: File;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileStatus: FileStatus;
  outputObjectUrl: string;
  outputFileSize: number;
  outputFullName: string;
};

type FileContextType = {
  fileList: FileData[]; // The list of files
  // Add task to the list needs the task name and deadline
  addFile: (files: File[]) => void; // able to upload a list of files
  deleteFile: (index: number) => void;
  parseFileConvert: (
    index: number,
    newFileName: string,
    newFileType: string
  ) => void;
  updateFileStatus: (index: number, newStatus: FileStatus) => void;
  handleDownload: (index: number) => void;
};

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [fileList, setFileList] = useState<FileData[]>(
    JSON.parse(localStorage.getItem("fileList") ?? "[]")
  );

  useEffect(() => {
    localStorage.setItem("fileList", JSON.stringify(fileList));
  }, [fileList]);

  const addFile = (files: File[]): void => {
    const newFiles = files.map((file) => ({
      fileObj: file,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileStatus: "ready",
      outputObjectUrl: "",
      outputFileSize: 0,
      outputFullName: "",
    }));
    setFileList([...fileList, ...newFiles]);
  };

  const deleteFile = (index: number) => {
    setFileList(fileList.filter((_, i) => i !== index));
  };

  // This ref will be passed into the convertFile function
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    // the loadFfmpeg function is defined in lib/utils.ts
    const ffmpeg_response: FFmpeg = await loadFfmpeg();
    ffmpegRef.current = ffmpeg_response;
  };

  async function parseFileConvert(
    index: number,
    newFileName: string,
    newFileType: string
  ) {
    // convert the specific file's status to converting
    const newFileList = [...fileList];
    newFileList[index].fileStatus = FileStatus.Converting;
    setFileList(newFileList);

    const newOutputFullName = `${newFileName}.${newFileType}`;

    try {
      // Wait for the conversion result
      const convertedObj = await convertFile(
        ffmpegRef.current,
        fileList[index].fileObj,
        newOutputFullName
      );

      // set the new file status to converted
      newFileList[index].fileStatus = FileStatus.Converted;
      newFileList[index].outputObjectUrl = convertedObj.outputObjectUrl;
      newFileList[index].outputFileSize = convertedObj.outputFileSize;
      newFileList[index].outputFullName = convertedObj.outputFullName;
      setFileList(newFileList);
      console.log("File converted successfully", fileList[index]);
    } catch (error) {
      console.error("File conversion failed:", error);
    }
  }

  const handleDownload = (index: number) => {
    downloadFile(
      fileList[index].outputObjectUrl,
      fileList[index].outputFullName
    );
    // update the file status to downloaded
    updateFileStatus(index, FileStatus.Downloaded);
  };
  const updateFileStatus = (index: number, newStatus: FileStatus) => {
    const newFileList = [...fileList];
    newFileList[index].fileStatus = newStatus;
    setFileList(newFileList);
  };
  const value: FileContextType = {
    fileList,
    addFile,
    deleteFile,
    parseFileConvert,
    updateFileStatus,
    handleDownload,
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};

export const useFile = (): FileContextType => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useTodo must be used within a TodoProvider");
  }
  return context;
};
