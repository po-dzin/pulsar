import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    const { data: articles, error } = await supabase.from("kb_articles").select("id, slug");
    if (error) {
        console.error("Error fetching articles:", error);
        return;
    }

    for (const article of articles) {
        console.log(`Processing ${article.slug}...`);
        try {
            let contentRu = "";
            let contentEn = "";

            const pRu = path.join(process.cwd(), `src/content/kb/ru/${article.slug}.md`);
            const pEn = path.join(process.cwd(), `src/content/kb/en/${article.slug}.md`);

            if (fs.existsSync(pRu)) {
                contentRu = fs.readFileSync(pRu, "utf-8");
            }
            if (fs.existsSync(pEn)) {
                contentEn = fs.readFileSync(pEn, "utf-8");
            }

            const { error: updateError } = await supabase
                .from("kb_articles")
                .update({ content_ru: contentRu, content_en: contentEn })
                .eq("id", article.id);

            if (updateError) {
                console.error(`Error updating ${article.slug}:`, updateError);
            } else {
                console.log(`Updated ${article.slug} successfully.`);
            }
        } catch (err) {
            console.error(`Failed to process ${article.slug}`, err);
        }
    }
}

run().then(() => console.log("Done."));
