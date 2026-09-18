"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

type Section = { id: string; slug: string; title: string; capacity: number };
type GalleryImage = { id: string; section_id: string; storage_path: string; label: string; alt_text: string; position: number; published: boolean };
type SupabaseClient = ReturnType<typeof createPublicSupabaseClient>;

export function AdminGallery() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [status, setStatus] = useState("Loading gallery…");

  async function load(client: SupabaseClient) {
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    const { data: isAdmin } = await client.rpc("is_admin");
    if (!isAdmin) {
      setStatus("This account is not an authorised Coco Palms administrator.");
      return;
    }
    const [{ data: nextSections }, { data: nextImages }] = await Promise.all([
      client.from("gallery_sections").select("id,slug,title,capacity").order("sort_order"),
      client.from("gallery_images").select("*").order("position"),
    ]);
    setSections((nextSections ?? []) as Section[]);
    setImages((nextImages ?? []) as GalleryImage[]);
    setStatus("");
  }

  useEffect(() => {
    try {
      const client = createPublicSupabaseClient();
      setSupabase(client);
      void load(client);
    } catch {
      setStatus("Gallery management is not configured.");
    }
  }, []);

  async function save(event: FormEvent<HTMLFormElement>, section: Section, position: number, current?: GalleryImage) {
    event.preventDefault();
    if (!supabase) return;
    setStatus("Saving…");
    const form = new FormData(event.currentTarget);
    const file = form.get("image") as File;
    let storagePath = current?.storage_path ?? "";
    if (file?.size) {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      storagePath = current?.storage_path ?? `${section.slug}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from("coco-palms-gallery").upload(storagePath, file, { upsert: true });
      if (error) {
        setStatus(error.message);
        return;
      }
    }
    if (!storagePath) {
      setStatus("Choose an image before saving this position.");
      return;
    }
    const payload = {
      section_id: section.id,
      storage_path: storagePath,
      label: String(form.get("label") || `${section.title} ${position}`),
      alt_text: String(form.get("alt") || form.get("label") || `${section.title} ${position}`),
      position,
      published: form.get("published") === "on",
      updated_at: new Date().toISOString(),
    };
    const response = current
      ? await supabase.from("gallery_images").update(payload).eq("id", current.id)
      : await supabase.from("gallery_images").insert(payload);
    if (response.error) {
      setStatus(response.error.message);
      return;
    }
    setStatus("Saved.");
    await load(supabase);
  }

  async function remove(image: GalleryImage) {
    if (!supabase) return;
    setStatus("Removing…");
    await supabase.storage.from("coco-palms-gallery").remove([image.storage_path]);
    await supabase.from("gallery_images").delete().eq("id", image.id);
    await load(supabase);
    setStatus("Position cleared.");
  }

  if (!supabase || status === "Loading gallery…" || (!sections.length && status)) return <p>{status}</p>;

  return <>
    <div className="admin-toolbar">
      <div><span className="eyebrow">Gallery management</span><h1>36 image positions</h1></div>
      <button className="text-link" onClick={async () => { await supabase.auth.signOut(); router.push("/admin/login"); }}>Sign out</button>
    </div>
    {status && <p className="admin-status" role="status">{status}</p>}
    {sections.map((section) => <section className="admin-section" key={section.id}>
      <h2>{section.title}</h2>
      <div className="admin-slots">{Array.from({ length: 12 }, (_, index) => {
        const position = index + 1;
        const current = images.find((image) => image.section_id === section.id && image.position === position);
        return <form className="admin-slot" key={position} onSubmit={(event) => save(event, section, position, current)}>
          <strong>{section.title} {position}</strong>
          {current && <img src={supabase.storage.from("coco-palms-gallery").getPublicUrl(current.storage_path).data.publicUrl} alt="" />}
          <label>Image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></label>
          <label>Visible label<input name="label" defaultValue={current?.label ?? ""} /></label>
          <label>Alternative text<input name="alt" defaultValue={current?.alt_text ?? ""} /></label>
          <label className="consent"><input name="published" type="checkbox" defaultChecked={current?.published ?? false} /> Published</label>
          <div className="slot-actions"><button className="button button-small">Save</button>{current && <button type="button" className="danger-link" onClick={() => remove(current)}>Clear</button>}</div>
        </form>;
      })}</div>
    </section>)}
  </>;
}
