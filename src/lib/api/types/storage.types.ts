import { ModuleName } from '@/constant/modules.constants';

export type GetPreSignedUrlForUploadPayload = {
  itemId?: string;
  metaData?: string;
  name: string;
  parentDirectoryId?: string;
  tags?: string;
  accessModifier?: string;
  configurationName?: string;
  projectKey: string;
  additionalProperties?: Record<string, string>;
  moduleName: string | ModuleName;
};

export type GetPreSignedUrlForUploadResponse = {
  errors?: Record<string, string>;
  isSuccess: boolean;
  uploadUrl?: string;
  fileId?: string;
};
