
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://woemdwjksfspjunzukre.supabase.co",
  "sb_publishable_hcl46nJjacErmRsQSvheIA_Kte_tr5J"
);

const loginButton = document.querySelector("#login-button");
const userInfo = document.querySelector("#user-info");
const form = document.querySelector("#submission-form");
const status = document.querySelector("#submission-status");

async function updateUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  const user = data.user;

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
    const { data } = await supabase.auth.getSession();

    if (data.session) {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  await updateUser();
} else {
  userInfo.textContent = "";
  loginButton.textContent = "Entrar com Google";

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://lightbusters.github.io/squad-busters-archive/"
    }
  });

  if (error) throw error;
    }
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
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) throw new Error("Entre com Google primeiro.");

    const file = document.querySelector("#submission-image").files[0];
    const title = document.querySelector("#submission-title").value.trim();
    const category = document.querySelector("#submission-category").value;
    const description = document.querySelector("#submission-description").value.trim();
    const source = document.querySelector("#submission-source").value.trim();

    if (!file) throw new Error("Selecione uma imagem.");
    if (!file.type.startsWith("image/")) throw new Error("Arquivo inválido.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Imagem maior que 5 MB.");

    const extension = file.name.split(".").pop().toLowerCase();
    if (!["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
      throw new Error("Formato não permitido.");
    }

    const imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("community-submissions")
      .upload(imagePath, file, { contentType: file.type });

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
      await supabase.storage.from("community-submissions").remove([imagePath]);
      throw insertError;
    }

    form.reset();
    status.textContent = "Contribuição enviada! Aguardando aprovação.";
  } catch (error) {
    status.textContent = `Erro: ${error.message}`;
  } finally {
    submitButton.disabled = false;
  }
});

updateUser().catch(error => {
  userInfo.textContent = `Erro: ${error.message}`;
});
