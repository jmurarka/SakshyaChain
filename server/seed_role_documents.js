import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/db.json');
const roleDocsPath = path.join(__dirname, 'data/role_documents.json');

function seedDBWithRoleDocuments() {
  try {
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const roleDocsData = JSON.parse(fs.readFileSync(roleDocsPath, 'utf8'));

    let addedCount = 0;
    let updatedCount = 0;

    roleDocsData.personas.forEach(persona => {
      persona.documents.forEach(doc => {
        const existingIdx = dbData.documents.findIndex(d => d.id === doc.id);
        const fullDocObj = {
          id: doc.id,
          title: doc.title,
          caseId: doc.caseId,
          caseTitle: `Case ${doc.caseId}`,
          category: doc.category,
          clearanceLevel: doc.clearanceLevel,
          authorId: persona.id,
          authorName: doc.authorName || persona.name,
          authorRole: doc.authorRole || persona.role,
          department: doc.department || persona.department,
          dateCreated: doc.dateCreated || new Date().toISOString(),
          version: '1.0',
          status: 'VERIFIED_PKI',
          extractedText: doc.extractedText,
          mimeType: 'text/plain',
          originalFileName: `${doc.id}_${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`,
          payloadHash: Buffer.from(doc.extractedText).toString('hex').slice(0, 64),
          fileSize: Buffer.byteLength(doc.extractedText),
          encryptionMetadata: {
            algorithm: 'AES-256-GCM',
            kmsKeyId: 'KMS-MASTER-KEY-PROD-2026',
            encryptedDEK: 'e5eb4ac8885339c1e664ad38e80a51a17066c888a4c1eaa814e169f77fbdabc271e83cdf2fda4dd501ecb8ebe629fae64a8d663af8d3a402412da301f25c997c',
            dekIv: '226f766d5ecc91be4f2ca24f',
            dekAuthTag: 'c2037392fafccba3abd7014437fb1083',
            payloadIv: '88551337b039214c0e8a7944',
            payloadAuthTag: '5d33e03ef88d9f05d911fccfcc86df27'
          },
          chainOfCustody: [
            {
              action: 'DOCUMENT_FILED_AND_VERIFIED',
              actorName: doc.authorName || persona.name,
              department: doc.department || persona.department,
              timestamp: doc.dateCreated || new Date().toISOString()
            }
          ]
        };

        if (existingIdx >= 0) {
          dbData.documents[existingIdx] = { ...dbData.documents[existingIdx], ...fullDocObj };
          updatedCount++;
        } else {
          dbData.documents.push(fullDocObj);
          addedCount++;
        }
      });
    });

    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
    console.log(`[Seed Complete] Successfully updated ${updatedCount} documents and added ${addedCount} new persona-tailored documents to db.json.`);
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
}

seedDBWithRoleDocuments();
