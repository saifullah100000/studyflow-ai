import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

import { join, resolve } from 'node:path';

import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { FileKind } from '../generated/prisma/enums';



interface PdfNote {

  id: string;

  userId: string;

  title: string;

  topic: string | null;

  introduction: string | null;

  learningObjectives: string[];

  summary: string | null;

  content: string | null;

  createdAt: Date;


  sections: Array<{
    heading: string;
    content: string;
  }>;


  flashcards: Array<{
    front: string;
    back: string;
  }>;


  quizzes: Array<{
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string | null;
    }>;
  }>;

}



export interface GeneratedPdf {

  buffer: Uint8Array;

  filename: string;

  path: string;

  url?: string;

  fileId?: string;

}





@Injectable()
export class PdfService {


  private template: HandlebarsTemplateDelegate | null = null;



  constructor(

    private readonly prisma: PrismaService,

    private readonly storageService: StorageService,

  ) {


    Handlebars.registerHelper(
      'add',
      (value: number, amount: number) =>
        value + amount,
    );


    Handlebars.registerHelper(
      'letter',
      (index: number) =>
        String.fromCharCode(65 + index),
    );


  }





  async generateForNote(
    userId: string,
    noteId: string,
  ): Promise<GeneratedPdf> {


    const note =
      await this.prisma.note.findFirst({

        where: {

          id: noteId,

          userId,

        },


        include: {

          sections: {
            orderBy:{
              position:'asc'
            }
          },


          flashcards:{
            orderBy:{
              position:'asc'
            }
          },


          quizzes:{

            orderBy:{
              position:'asc'
            },


            include:{

              questions:{
                orderBy:{
                  position:'asc'
                }
              }

            }

          }

        }

      });



    if(!note){

      throw new NotFoundException(
        'Note not found',
      );

    }



    return this.renderNote(note);

  }








  async renderNote(
    note: PdfNote,
  ): Promise<GeneratedPdf> {



    const template =
      await this.getTemplate();




    const html =
      template({

        title: note.title,

        topic:
          note.topic ?? note.title,


        subject:
          note.topic ?? 'Study notes',


        studentLevel:
          'Personalized study guide',


        language:
          'English',


        studentName:
          'StudyFlow learner',


        generatedAt:
          new Intl.DateTimeFormat(
            'en',
            {
              dateStyle:'long'
            }
          ).format(note.createdAt),



        introduction:
          note.introduction,



        objectives:
          note.learningObjectives,



        sections:[

          ...(note.content
            ? [
              {
                heading:'Core concepts',
                content:note.content
              }
            ]
            : []),


          ...note.sections

        ],



        summary:
          note.summary ??
          'Review the concepts and practise active recall.',



        mcqs:
          note.quizzes.flatMap(
            quiz =>
              quiz.questions
          ),



        flashcards:
          note.flashcards

      });





    let browser:
      Awaited<
        ReturnType<
          typeof puppeteer.launch
        >
      >
      | undefined;





    try{


      browser =
        await puppeteer.launch({

          headless:true,

          args:[
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]

        });




      const page =
        await browser.newPage();




      await page.setContent(
        html,
        {
          waitUntil:'load'
        }
      );





      const buffer =
        await page.pdf({

          format:'A4',

          printBackground:true,

          preferCSSPageSize:true,


          displayHeaderFooter:true,


          headerTemplate:
            this.headerTemplate(),


          footerTemplate:
            this.footerTemplate(),



          margin:{

            top:'22mm',

            right:'16mm',

            bottom:'20mm',

            left:'16mm'

          }

        });






      const outputDirectory =
        resolve(
          process.cwd(),
          'tmp',
          'pdfs',
        );



      await mkdir(
        outputDirectory,
        {
          recursive:true
        }
      );





      const filename =
        `note-${note.id}.pdf`;




      const outputPath =
        join(
          outputDirectory,
          filename,
        );




      await writeFile(
        outputPath,
        buffer,
      );







      /*
      ==============================
      UPLOAD TO R2
      ==============================
      */


      const objectKey =
        `notes/${note.id}.pdf`;




      await this.storageService.uploadPdf(

        outputPath,

        objectKey,

      );







      const downloadUrl =
        await this.storageService.getSignedUrl(
          objectKey,
        );







      /*
      ==============================
      SAVE FILE RECORD
      ==============================
      */



      const fileRecord =
        await this.prisma.file.create({

          data:{


            originalName:
              filename,


            storageKey:
              objectKey,


            mimeType:
              'application/pdf',


            sizeBytes:
              buffer.length,


            kind:
              FileKind.GENERATED_PDF,


            publicUrl:
              downloadUrl,


            userId:
              note.userId,


            noteId:
              note.id,


          }

        });








      /*
      ==============================
      DELETE TEMP FILE
      ==============================
      */


      await rm(

        outputPath,

        {
          force:true
        }

      );







      return {

        buffer,

        filename,

        path:objectKey,

        url:downloadUrl,

        fileId:fileRecord.id,

      };





    }
    catch(error: unknown){

      console.error("========== PDF GENERATION ERROR ==========");

      console.error(error);

      console.error("==========================================");


      throw new InternalServerErrorException(

        'The PDF could not be generated. Please try again.',

        {

          cause:
            error instanceof Error
            ? error
            : undefined

        }

      );

}
    finally{


      await browser?.close();


    }



  }








  private async getTemplate()
  : Promise<HandlebarsTemplateDelegate>{


    if(this.template)
      return this.template;



    const templatePath =
      join(
        __dirname,
        'templates',
        'study-notes.template.html',
      );



    if(!existsSync(templatePath)){


      throw new InternalServerErrorException(

        `PDF template is missing at ${templatePath}`

      );

    }




    this.template =
      Handlebars.compile(

        await readFile(
          templatePath,
          'utf8'
        )

      );



    return this.template;


  }







  private headerTemplate():string{

    return `

    <div style="
    width:100%;
    padding:0 16mm;
    color:#4f46e5;
    font-family:Arial;
    font-size:8pt;
    font-weight:700;
    ">
    StudyFlow AI
    </div>

    `;

  }







  private footerTemplate():string{


    return `

    <div style="
    width:100%;
    padding:0 16mm;
    color:#5d6980;
    font-family:Arial;
    font-size:8pt;
    display:flex;
    justify-content:space-between;
    ">

    <span>
    Generated study guide
    </span>


    <span>
    Page
    <span class="pageNumber"></span>
    of
    <span class="totalPages"></span>
    </span>


    </div>

    `;

  }








  private slugify(value:string):string{


    const slug =
      value
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      );



    return slug || 'study-notes';

  }


}