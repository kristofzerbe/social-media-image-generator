'use strict';

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import frontmatter from 'front-matter';
import * as handlebars from 'handlebars/dist/handlebars.js'
import puppeteer from "./node_modules/puppeteer/cjs-entry-core.js";
import imagemin from "./node_modules/imagemin/index.js";
import imageminPngquant from "./node_modules/imagemin-pngquant/index.js";

//set __dirname for node 14.15 and above
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const _tempFolder = "./~temp";

var _postFolder;
var _photoFolder;
var _templateFile;
var _template;
var _targetFolder;

class Generator {

  constructor(postFolder, photoFolder, templateFile, targetFolder) { 
      
    if (!fs.existsSync(_tempFolder)){
      fs.mkdirSync(_tempFolder);
    }

    _postFolder = path.join(__dirname, postFolder);
    _photoFolder = path.join(__dirname, photoFolder);
    _templateFile = path.join(__dirname, templateFile);
    _targetFolder = path.join(__dirname, targetFolder);

    if (!fs.existsSync(_postFolder)) {
      throw "Post folder not found"
    }
    if (!fs.existsSync(_photoFolder)) {
      throw "Photo folder not found"
    }
    if (!fs.existsSync(_templateFile)) {
      throw "Template file not found"
    }
    if (!fs.existsSync(_targetFolder)) {
      throw "Target folder not found"
    }

    let source = fs.readFileSync(_templateFile).toString('utf8');
    _template = handlebars.compile(source);
      
  }

  /**
   * Runs the generation of a social media image per post
   */
  generate() {
    let self = this;

    const postFiles = 
      fs.readdirSync(_postFolder).map(fileName => {
        return path.join(_postFolder, fileName)
      }).filter(fileName => {
        return fs.lstatSync(fileName).isFile()
      })
    
    //console.log(postFiles);
  
    var postsProcessed = 0;
    postFiles.forEach((file) => {
      fs.readFile(file, 'utf8', function(err, data) {
        if (err) throw err

        let content = frontmatter(data);
        //console.log(content.attributes)
    
        if (content.attributes.photograph?.file) { // process posts with photo only
          self.processPost(
            path.basename(file, path.extname(file)),
            {
              title: content.attributes.title, 
              subtitle: content.attributes.subtitle, 
              photo: self.getFileUrl(path.join(_photoFolder, content.attributes.photograph.file))
            })
            .then(() => {
              //console.log(postsProcessed + '=' + postFiles.length);
              if (postsProcessed === postFiles.length) {
                fs.rmdirSync(_tempFolder, { recursive: true });
              }
            });
        }
        postsProcessed += 1;
      })
    });
    
  }

  /**
   * Converts a file path into a file URL.
   * @param {String} filePath 
   * @returns {String} File URL
   */
  getFileUrl(filePath) {
    let fileUrl = path.resolve(filePath).replace(/\\/g, '/');
    if (fileUrl[0] !== '/') {
      fileUrl = '/' + fileUrl;
    }
    return encodeURI('file://' + fileUrl);
  }

  /**
   * Processes a post and creates a temporary HTML file, which will be converted to an image.
   * @param {String} fileName Name of the image file without extension.
   * @param {Object} vars     Template variables.
   */
  async processPost(fileName, vars) {
    //console.log(fileName + " >> " + vars.title + " - " + vars.subtitle + " : " + vars.photo);

    let html = _template(vars);
    //console.log(html);

    let tempFile = path.join(_tempFolder, fileName + ".html");

    fs.writeFile(tempFile, html, (err) => {
      if(err) { throw(err); }
      console.log(tempFile + " saved");
    });

    await this.createImage(fileName, tempFile);

    return;
  }

  /**
   * Generates an optimized PNG image out of the temporary HTMl file.
   * @param {String} fileName Name of the image file without extension.
   * @param {String} tempFile Path to the temporary HTML file.
   */
  async createImage(fileName, tempFile) {
    var self = this;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(self.getFileUrl(tempFile));

    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1
    });

    let imgFile = path.join(_targetFolder, fileName + ".png");

    await page.screenshot({
      path: imgFile
    });

    await browser.close();

    await imagemin([imgFile], 'build', {
      plugins: [
        imageminPngquant({ quality: '75-90' })
      ]
    });

    console.log(imgFile + " generated");
  
    return;
  }

}
export default Generator;