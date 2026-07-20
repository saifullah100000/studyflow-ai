// storage.service.ts

import { Injectable } from '@nestjs/common';

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import * as fs from 'fs';


@Injectable()
export class StorageService {

  private readonly client: S3Client;


  constructor() {

    this.client = new S3Client({
      region: 'auto',

      endpoint: process.env.R2_ENDPOINT,

      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },

    });

  }


  // ============================
  // STEP 7: Upload PDF to R2
  // ============================

  async uploadPdf(filePath: string, objectKey: string) {

    const file = fs.readFileSync(filePath);


    await this.client.send(

      new PutObjectCommand({

        Bucket: process.env.R2_BUCKET_NAME,

        Key: objectKey,

        Body: file,

        ContentType: 'application/pdf',

      }),

    );


    return objectKey;

  }



  // ============================
  // STEP 8: Delete PDF from R2
  // ============================

  async deletePdf(objectKey: string) {


    await this.client.send(

      new DeleteObjectCommand({

        Bucket: process.env.R2_BUCKET_NAME,

        Key: objectKey,

      }),

    );


  }



  // ============================
  // STEP 9: Generate Download URL
  // ============================

  async getSignedUrl(objectKey: string) {


    const command = new GetObjectCommand({

      Bucket: process.env.R2_BUCKET_NAME,

      Key: objectKey,

    });



    return getSignedUrl(

      this.client,

      command,

      {
        expiresIn: 3600,
      },

    );

  }

}