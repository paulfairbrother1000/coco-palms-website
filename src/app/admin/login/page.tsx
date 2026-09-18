"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export default function AdminLoginPage(){const router=useRouter();const[error,setError]=useState("");async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);const{error}=await createPublicSupabaseClient().auth.signInWithPassword({email:String(form.get("email")),password:String(form.get("password"))});if(error){setError("Sign-in failed.");return}router.push("/admin/gallery")}return <section className="admin-login"><form onSubmit={submit}><span className="eyebrow">Coco Palms management</span><h1>Sign in</h1><label>Email<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label>{error&&<p className="form-error">{error}</p>}<button className="button">Sign in</button></form></section>}
