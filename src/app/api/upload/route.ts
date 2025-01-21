import { NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { exec } from "child_process"
import { promisify } from "util"
import { nanoid } from "nanoid"

const execAsync = promisify(exec)

const VPS_USER = process.env.VPS_USER || 'debian'
const VPS_HOST = process.env.VPS_HOST
const VPS_PATH = process.env.VPS_PATH
const VPS_URL = process.env.VPS_URL
const VPS_SSH_KEY = process.env.VPS_SSH_KEY

if (!VPS_HOST || !VPS_PATH || !VPS_URL) {
    throw new Error('Missing required VPS configuration in environment variables')
}

const VPS_FULL_HOST = `${VPS_USER}@${VPS_HOST}`

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            )
        }

        if (!file.type.startsWith("video/")) {
            return NextResponse.json(
                { error: "File must be a video" },
                { status: 400 }
            )
        }

        const fileExt = file.name.split(".").pop()
        const fileName = `${nanoid()}.${fileExt}`
        const localPath = join("/tmp", fileName)

        console.log(`Saving file temporarily to ${localPath}`)

        try {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            await writeFile(localPath, buffer)
            console.log("File saved locally successfully")
        } catch (error) {
            console.error("Error saving file locally:", error)
            return NextResponse.json(
                { error: "Failed to save file locally" },
                { status: 500 }
            )
        }

        try {
            console.log(`Uploading to VPS: ${VPS_FULL_HOST}:${VPS_PATH}/videos/${fileName}`)

            const scpCommand = [
                'scp',
                VPS_SSH_KEY ? `-i ${VPS_SSH_KEY}` : '', // Only add SSH key if configured
                '-o StrictHostKeyChecking=no',
                '-o UserKnownHostsFile=/dev/null',
                '-o ConnectTimeout=10',
                `"${localPath}"`,
                `"${VPS_FULL_HOST}:${VPS_PATH}/videos/${fileName}"`
            ].filter(Boolean).join(' ') // Remove empty strings from command

            console.log('Executing command:', scpCommand)

            const { stdout, stderr } = await execAsync(scpCommand)

            if (stderr) {
                console.error("SCP stderr:", stderr)
            }
            if (stdout) {
                console.log("SCP stdout:", stdout)
            }

            // Clean up local file
            try {
                await execAsync(`rm "${localPath}"`)
                console.log("Local file cleaned up successfully")
            } catch (error) {
                console.error("Error cleaning up local file:", error)
            }

            const videoUrl = `${VPS_URL}/videos/${fileName}`
            console.log("Upload successful, video URL:", videoUrl)

            return NextResponse.json({
                success: true,
                url: videoUrl
            })
        } catch (error) {
            console.error("Error uploading to VPS:", error)
            try {
                await execAsync(`rm "${localPath}"`)
            } catch { }

            return NextResponse.json(
                {
                    error: "Failed to upload file to VPS. Please check server logs.",
                    details: error instanceof Error ? error.message : String(error)
                },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error("Error handling upload:", error)
        return NextResponse.json(
            {
                error: "Failed to process upload",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}
