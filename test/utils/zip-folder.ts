import * as fs from 'fs';

import archiver from 'archiver';

function zipFolder(sourceDir: string, outputFile: string) {
  return new Promise<void>((resolve) => {
    const output = fs.createWriteStream(outputFile);
    output.on('close', () => resolve());

    const archive = archiver('zip', {
      zlib: { level: 5 },
    });
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

export { zipFolder };
