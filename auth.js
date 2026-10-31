
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://woemdwjksfspjunzukre.supabase.co",
  "sb_publishable_hcl46nJjacErmRsQSvheIA_Kte_tr5J"
);

const loginButton = document.querySelector("#login-button");
const userInfo = document.querySelector("#user-info");
const form = document.querySelector("#submission-form");
const status = document.querySelector("#submission-status");

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function updateUser() {
  const user = await getCurrentUser();

  if (user) {
    const name =
      user.user_metadata.full_name ||
      user.user_metadata.name ||
      user.email;

    userInfo.textContent = `Conectado como ${name}`;
    loginButton.textContent = "Sair";
    form.hidden = false;
  } else {
    userInfo.textContent = "";
    loginButton.textContent = "Entrar com Google";
    form.hidden = true;
  }
}

loginButton.addEventListener("click", async () => {
  loginButton.disabled = true;

  try {
    const user = await getCurrentUser();

    if (user) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await updateUser();
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://lightbusters.github.io/squad-busters-archive/"
        }
      });

      if (error) throw error;
    }
  } catch (error) {
    userInfo.textContent = `Erro: ${error.message}`;
  } finally {
    loginButton.disabled = false;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  status.textContent = "Enviando contribuição...";

  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Você precisa entrar com Google primeiro.");
    }

    const file = document.querySelector("#submission-image").files[0];
    const title = document.querySelector("#submission-title").value.trim();
    const category = document.querySelector("#submission-category").value;
    const description = document.querySelector("#submission-description").value.trim();
    const source = document.querySelector("#submission-source").value.trim();

    if (!file) throw new Error("Selecione uma imagem.");
    if (!file.type.startsWith("image/")) {
      throw new Error("O arquivo precisa ser uma imagem.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("A imagem deve ter no máximo 5 MB.");
    }

    const extension = file.name.split(".").pop().toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif"];

    if (!allowedExtensions.includes(extension)) {
      throw new Error("Formato de imagem não permitido.");
    }

    const imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("community-submissions")
      .upload(imagePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    const contributorName =
      user.user_metadata.full_name ||
      user.user_metadata.name ||
      user.email;

    const { error: insertError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        contributor_name: contributorName,
        title,
        category,
        description,
        source_url: source || null,
        image_path: imagePath
      });

    if (insertError) {
      await supabase.storage
        .from("community-submissions")
        .remove([imagePath]);

      throw insertError;
    }

    form.reset();
    status.textContent = "Contribuição enviada! Ela ficará aguardando aprovação.";
  } catch (error) {
    status.textContent = `Erro: ${error.message}`;
  } finally {
    submitButton.disabled = false;
  }
});

supabase.auth.onAuthStateChange(() => {
  updateUser().catch(error => {
    userInfo.textContent = `Erro: ${error.message}`;
  });
});

updateUser().catch(error => {
  userInfo.textContent = `Erro: ${error.message}`;
});
