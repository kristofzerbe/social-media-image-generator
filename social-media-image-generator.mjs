'use strict';

import * as fs from 'fs';
import * as path from 'path';
import url from 'url';
import frontmatter from 'front-matter';
import * as handlebars from 'handlebars/dist/handlebars.js'
import puppeteer from "./node_modules/puppeteer/cjs-entry-core.js";
import imagemin from "./node_modules/imagemin/index.js";
import imageminPngquant from "./node_modules/imagemin-pngquant/index.js";

const _currentPath = path.dirname(url.fileURLToPath(import.meta.url));

const _tempFolder = "./~temp";

var _postFolder;
var _photoFolder;
var _templateFile;
var _template;
var _targetFolder;

class Generator {

  constructor(postFolder, photoFolder, templateFile, targetFolder) { 
      
    _postFolder = path.join(_currentPath, postFolder);
    _photoFolder = path.join(_currentPath, photoFolder);
    _templateFile = path.join(_currentPath, templateFile);
    _targetFolder = path.join(_currentPath, targetFolder);

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

    if (!fs.existsSync(_tempFolder)) {
      fs.mkdirSync(_tempFolder);
    }

    let source = fs.readFileSync(_templateFile).toString('utf8');
    _template = handlebars.compile(source);
      
  }

  /**
   * Runs the generation of a social media image per post
   */
  generate() {
    let self = this;

    const postFiles = this.getPostFiles(_postFolder);
    //console.log(postFiles);

    var postsProcessed = 0;
    postFiles.forEach((file) => {
      fs.readFile(file, 'utf8', function(err, data) {
        if (err) throw err

        let content = frontmatter(data);
        //console.log(content.attributes)

        let fileName = path.basename(file, path.extname(file));
    
        // only process posts with defined photograph file and if social media file is missing
        if (content.attributes.photograph?.file && 
            !fs.existsSync(path.join(_targetFolder, fileName + ".png"))) {
          
          self.processPost(
            fileName,
            {
              title: content.attributes.title, 
              subtitle: content.attributes.subtitle, 
              photo: url.pathToFileURL(path.join(_photoFolder, content.attributes.photograph.file))
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
   * Get all post MD files recursively
   * @param {String} dirPath  Starting folder to look for MD files 
   * @param {Array} allFiles  Array for storing files found
   * @returns 
   */
  getPostFiles(dirPath, allFiles) {
    let files = fs.readdirSync(dirPath);

    allFiles = allFiles || [];

    files.forEach((file) => {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        allFiles = this.getPostFiles(dirPath + "/" + file, allFiles)
        //console.log("DIR: " + file);
      } else if (file.indexOf(".md")>=0) {
        allFiles.push(path.join(dirPath, "/", file))
        //console.log("FILE:" + path.join(_postFolder, file));
      }
    });
    return allFiles;
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
      //console.log(tempFile + " saved");
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

    await page.goto(url.pathToFileURL(tempFile));

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

    console.log("\x1b[32m", "SOCIAL-MEDIA-IMAGE-GENERATOR: ", "\x1b[0m" + imgFile + " generated");
  
    return;
  }

}
export default Generator;