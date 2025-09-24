'use server';
/**
 * @fileOverview A flow for fetching data from Google Sheets.
 *
 * - getSheetData - A function that fetches and processes data from a specified Google Sheet.
 * - GetSheetDataInput - The input type for the getSheetData function.
 * - PerformanceDataSchema - The Zod schema for the returned performance data.
 */

import { ai } from '@/ai/genkit';
import { google } from 'googleapis';
import { z } from 'zod';
import type { PerformanceData } from '@/lib/types';


const GetSheetDataInputSchema = z.object({
  spreadsheetId: z.string().describe('The ID of the Google Sheet to fetch data from.'),
  range: z.string().describe('The A1 notation of the range to retrieve, e.g., "Sheet1!A1:P100".'),
});
export type GetSheetDataInput = z.infer<typeof GetSheetDataInputSchema>;


const PerformanceDataSchema = z.array(
    z.object({
        agentId: z.string(),
        agentName: z.string(),
        team: z.string(),
        month: z.string(),
        quality: z.object({
            audits: z.number().nullable(),
            qaScore: z.number().nullable(),
            emailsSent: z.number().nullable(),
        }),
        productivity: z.object({
            chats: z.number().nullable(),
            callsInbound: z.number().nullable(),
            callsOutbound: z.number().nullable(),
            callsTotal: z.number().nullable(),
            total: z.number().nullable(),
        }),
        frt: z.object({
            chatsSec: z.number().nullable(),
            emailsHrs: z.number().nullable(),
        }),
        csat: z.object({
            surveys: z.number().nullable(),
            csat: z.number().nullable(),
            dsat: z.number().nullable(),
            cSatScore: z.number().nullable(),
        }),
    })
);

const getSheetDataFlow = ai.defineFlow(
  {
    name: 'getSheetDataFlow',
    inputSchema: GetSheetDataInputSchema,
    outputSchema: PerformanceDataSchema,
  },
  async ({ spreadsheetId, range }) => {
    
    const hasJsonCredentials = !!process.env.GOOGLE_CREDENTIALS_JSON;
    const hasFileCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!hasJsonCredentials && !hasFileCredentials) {
        throw new Error("Configuration Error: Neither GOOGLE_CREDENTIALS_JSON nor GOOGLE_APPLICATION_CREDENTIALS environment variables are set. Please provide your service account credentials.");
    }

    try {
        let auth;
        if (hasJsonCredentials) {
             const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON!);
             auth = new google.auth.GoogleAuth({
                 credentials,
                 scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
             });
        } else {
             auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
        }


        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            console.warn("No data or only headers found in the Google Sheet.");
            return [];
        }

        const headerRowIndex = rows.findIndex(row => row.map(cell => String(cell).trim().toLowerCase()).includes('agent name'));
        if (headerRowIndex === -1) {
             throw new Error("Could not find a header row with 'Agent name' in it. Please ensure the column header is present in row 2.");
        }
        
        const headers:string[] = rows[headerRowIndex].map(h => String(h).trim().toLowerCase());
        const dataRows = rows.slice(headerRowIndex + 1);

        
        const findHeaderIndex = (possibleNames: string[]): number => {
            for (const name of possibleNames) {
                const index = headers.indexOf(name.toLowerCase());
                if (index !== -1) {
                    return index;
                }
            }
            return -1;
        }

        const agentNameIndex = findHeaderIndex(['Agent Name', 'Agent', 'Name']);
        if (agentNameIndex === -1) {
            throw new Error("Could not find 'Agent Name' column in the sheet. Please ensure the column header is named correctly.");
        }

        const nameMapping: Record<string, string> = {
            'esraa tarek': 'Esraa Tarek Eroq',
            'rima khaled': 'Rima Zaki',
            'ashraf aboelmagd': 'Ashraf Essam',
            'mohamed khier': 'Mohamed Kheer',
            'ahmed ezz eldin': 'Ahmed Ezz ElDin',
            'marwan zakrya': 'Marwan Zakaria',
        };
        
        const data: PerformanceData[] = dataRows.map((row, index): PerformanceData | null => {
            if(!row[agentNameIndex] || row.every(cell => cell === '' || cell === '-')) return null;

            const getHeaderIndex = (possibleHeaders: string[]) => {
                 return findHeaderIndex(possibleHeaders);
            }

            const toNumber = (possibleHeaders: string[]) => {
                const index = getHeaderIndex(possibleHeaders);
                if (index === -1) return null;
                const val = row[index];
                if (val === null || val === undefined || val === '' || val === '-') return null;
                const num = Number(String(val).replace(/,/g, ''));
                return isNaN(num) ? null : num;
            };

            const toScore = (possibleHeaders: string[]) => {
                const index = getHeaderIndex(possibleHeaders);
                if (index === -1) return null;
                const val = row[index];

                if (val === null || val === undefined || val === '' || val === '-') return null;
                if (typeof val === 'number') {
                    return val > 1 ? val / 100 : val;
                }
                 if (typeof val === 'string' && val.includes('%')) {
                    const num = Number(val.replace(/[% ,]/g, ''));
                    return isNaN(num) ? null : num / 100;
                }
                const num = Number(String(val).replace(/,/g, ''));
                if (isNaN(num)) return null;
                return num > 1 ? num / 100 : num;
            }
            
            const getString = (possibleHeaders: string[]) => {
                 const index = getHeaderIndex(possibleHeaders);
                 if (index === -1) return null;
                 return row[index] || null;
            }
            
            const rawAgentName = (row[agentNameIndex] || 'Unknown').toLowerCase().trim();
            const agentName = nameMapping[rawAgentName] || rawAgentName.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');


            return {
                agentId: `sheet-agent-${index}`,
                agentName: agentName,
                team: getString(['Lead', 'Team']) || 'Unassigned',
                month: getString(['Month']) || new Date().toLocaleString('default', { month: 'long' }),
                quality: {
                    audits: toNumber(['Audits']),
                    qaScore: toScore(['QA Score']),
                    emailsSent: toNumber(['E-mails Sent', 'Emails Sent']),
                },
                productivity: {
                    chats: toNumber(['Chats']),
                    callsInbound: toNumber(['Inbound']),
                    callsOutbound: toNumber(['Outbound']),
                    callsTotal: toNumber(['Total Calls', 'Total']),
                    total: toNumber(['Total Prod.', 'Total Productivity']),
                },
                frt: {
                    chatsSec: toNumber(['Chats (sec.)', 'Chats (sec)']),
                    emailsHrs: toNumber(['E-mails (Hrs)', 'Emails (Hrs)']),
                },
                csat: {
                    surveys: toNumber(['Surveys', 'Surveys volume']),
                    csat: toNumber(['CSAT']),
                    dsat: toNumber(['DSAT']),
                    cSatScore: toScore(['C-Sat Score', 'CSAT Score']),
                }
            };
        }).filter((item): item is PerformanceData => item !== null);

        return data;

    } catch (error: any) {
        console.error('Error fetching Google Sheet data:', error.message);
        throw new Error(`Failed to fetch data from Google Sheets. Please ensure the Spreadsheet ID is correct and that the service account has 'Viewer' permissions on the sheet. Error: ${error.message}`);
    }
  }
);


export async function getSheetData(input: GetSheetDataInput): Promise<PerformanceData[]> {
    return await getSheetDataFlow(input);
}
