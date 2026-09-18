import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email/resend";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

const schema=z.object({name:z.string().trim().min(2).max(120),email:z.email(),message:z.string().trim().min(5).max(4000),wantsPromos:z.string().optional()});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

export async function POST(request:NextRequest){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Please check your details."},{status:400});

  const v=parsed.data;
  const wantsPromos=v.wantsPromos==="true";
  let stored=true;
  try {
    const{error}=await createPublicSupabaseClient().rpc("create_contact_enquiry",{p_name:v.name,p_email:v.email,p_message:v.message,p_wants_promos:wantsPromos});
    if(error)stored=false;
  } catch {
    stored=false;
  }

  try {
    await sendEmail({
      to:"hello@cocopalms-antigua.com",
      subject:"Coco Palms Enquiry",
      replyTo:v.email,
      text:`COCO PALMS WEBSITE ENQUIRY\n\nName: ${v.name}\nEmail: ${v.email}\nMarketing updates: ${wantsPromos ? "Yes" : "No"}\n\nMessage:\n${v.message}`,
      html:`<h1>Coco Palms website enquiry</h1><p><strong>Name:</strong> ${escapeHtml(v.name)}</p><p><strong>Email:</strong> ${escapeHtml(v.email)}</p><p><strong>Marketing updates:</strong> ${wantsPromos ? "Yes" : "No"}</p><h2>Message</h2><p>${escapeHtml(v.message).replace(/\n/g,"<br>")}</p>`,
    });
  } catch {
    return NextResponse.json({error:"Your message was saved, but the notification email could not be sent. Please email us directly."},{status:503});
  }

  return NextResponse.json({ok:true,stored},{status:201});
}
