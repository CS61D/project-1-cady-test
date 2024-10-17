import { type FileData, FileStatus, useFile } from "@/FileContext";
import { downloadFile, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { ImageOutputFormat } from "@/lib/constants";
import { useEffect, useState } from "react";
import { Spinner } from "./ui/spinner";

type FileListData = {
  currFileName: string;
  newFileName: string;
  fileSize: number;
  currFileType: string;
  newFileType: string;
  fileStatus: "ready" | "converting" | "converted" | "error" | "downloaded";
};

export const FileList = () => {
  const { fileList, deleteFile, parseFileConvert, handleDownload } = useFile();
  const [tentativeFileList, setTentativeFileList] = useState<FileListData[]>(
    []
  );

  useEffect(() => {
    setTentativeFileList(
      fileList.map((file) => ({
        currFileName: file.fileName,
        newFileName: file.fileName,
        fileSize: file.fileSize,
        currFileType: file.fileType,
        newFileType: file.fileType,
        fileStatus: file.fileStatus,
      }))
    );
  }, [fileList]);
  console.log(tentativeFileList);
  const handleNameChange = (index: number, newName: string) => {
    const newFileList = [...tentativeFileList];
    newFileList[index].newFileName = newName;
    setTentativeFileList(newFileList);
  };

  const handleTypeChange = (index: number, newType: string) => {
    const newFileList = [...tentativeFileList];
    newFileList[index].newFileType = newType;
    setTentativeFileList(newFileList);
  };
  return (
    <div className="space-between m-2 w-5/6 space-y-6">
      {tentativeFileList.map((file, index) => (
        <div
          key={file.currFileName}
          className="flex items-center justify-between border-b-2 p-2"
        >
          <div className="flex flex-col">
            <p>{file.currFileName}</p>
            <p>{formatFileSize(file.fileSize)}</p>
          </div>

          <div className="flex flex-row">
            <div className="flex flex-col">
              <div>New File Name </div>
              <Input
                placeholder="Enter new file name"
                onChange={(e) => handleNameChange(index, e.target.value)}
              />
            </div>
            <div className="flex flex-col space-x-2">
              <div>Select File Type</div>
              <Select
                onValueChange={(value) => handleTypeChange(index, value)}
                defaultValue={file.currFileType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={file.currFileType} />
                </SelectTrigger>

                <SelectContent>
                  {ImageOutputFormat.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-row space-x-2">
            {file.fileStatus === FileStatus.Ready ? (
              <Button
                onClick={() =>
                  parseFileConvert(index, file.newFileName, file.newFileType)
                }
              >
                Convert
              </Button>
            ) : file.fileStatus === FileStatus.Converting ? (
              <div className="flex flex-row space-x-1">
                <Spinner className="h-6 w-6" />
                <Button disabled>Converting</Button>
              </div>
            ) : file.fileStatus === FileStatus.Converted ? (
              <div className="flex flex-row space-x-2 ">
                {Math.round(
                  (fileList[index].outputFileSize / fileList[index].fileSize) *
                    100
                ) > 100 ? (
                  <div className="text-green-600">
                    File Size Increased{" "}
                    {Math.round(
                      (fileList[index].outputFileSize /
                        fileList[index].fileSize) *
                        100
                    )}
                    %
                  </div>
                ) : (
                  <div className="text-red-600">
                    File Size Decreased{" "}
                    {Math.round(
                      (fileList[index].outputFileSize /
                        fileList[index].fileSize) *
                        100
                    )}
                    %
                  </div>
                )}

                <Button
                  onClick={() => {
                    handleDownload(index);
                  }}
                >
                  Download
                </Button>
              </div>
            ) : (
              file.fileStatus === FileStatus.Downloaded && (
                <Button disabled>Downloaded</Button>
              )
            )}

            <Button onClick={() => deleteFile(index)}>Delete</Button>
          </div>
        </div>
      ))}
    </div>
  );
};
