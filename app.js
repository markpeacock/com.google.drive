'use strict';

const Homey = require('homey');
const fs = require('fs');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = Homey.env.CLIENT_ID;
const CLIENT_SECRET = Homey.env.CLIENT_SECRET;
const REFRESH_TOKEN = Homey.env.REFRESH_TOKEN;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
const drive = google.drive({ version: 'v3', auth: oauth2Client });

class GoogleDrive extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Google Drive has been initialized');
    this.initializeActions();
  }

  async initializeActions() {
    const sendImageCard = this.homey.flow.getActionCard("save_image");
    sendImageCard.registerRunListener(async (args) => {

      const now = new Date();
      const image = args.droptoken;

      const stream = await image.getStream();

      oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

      // File metadata
      const fileMetadata = {
        name: args.camera + '-' + now.toISOString() + '.jpg' ,  // The name of the file you want to upload
        parents: [args.folder]  // Replace with the ID of the folder you want to upload to
      };

      // Media data
      const media = {
        mimeType: 'image/jpeg',
        body: stream
      };

      uploadFile(fileMetadata, media)

    });
  }
}

async function streamToBase64(stream) {
  return new Promise((resolve, reject) => {
    let data = '';

    stream.setEncoding('base64');

    stream.on('data', chunk => {
      data += chunk;
    });

    stream.on('end', () => {
      resolve(data);
    });

    stream.on('error', err => {
      reject(err);
    });
  });
}

async function uploadFile(fileMetadata, media) {
  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'  // Specify the fields you want in the response
    });
    console.log('File ID:', response.data.id);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

module.exports = GoogleDrive;
