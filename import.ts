import { PrismaClient, Record } from "@prisma/client";
import * as musicMetadata from "music-metadata";

import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const libraryDir = path.join(".", "library");

const existingLibrary = await prisma.record.findMany({});
const localLibrary = fs.readdirSync(libraryDir);

for (const localFilename of localLibrary) {
  const index = existingLibrary.findIndex((e) => e.filename == localFilename);
  if (index != -1) continue; // If the record already exists, skip

  const fullFilepath = path.join(libraryDir, localFilename);
  // @ts-ignore
  const metadata = await musicMetadata.parseFile(fullFilepath);

  const trackName = metadata.common.title ?? localFilename;

  await prisma.record.create({
    data: {
      filename: localFilename,
      trackName: trackName,
    },
  });
}
