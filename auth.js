
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://woemdwjksfspjunzukre.supabase.co",
  "sb_publishable_hcl46nJjacErmRsQSvheIA_Kte_tr5J"
);

const loginButton = document.querySelector("#login-button");
const userInfo = document.querySelector("#user-info");

async function updateUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  if (data.user) {
    const name =
      data.user.user_metadata.full_name ||
      data.user.user_metadata.name ||
      data.user.email;

    userInfo.textContent = `Conectado como ${name}`;
    loginButton.textContent = "Sair";
  } else {
    userInfo.textContent = "";
    loginButton.textContent = "Entrar com Google";
  }
}

loginButton.addEventListener("click", async () => {
  loginButton.disabled = true;
  userInfo.textContent = "Conectando...";

  try {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
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

supabase.auth.onAuthStateChange(() => {
  updateUser().catch(error => {
    userInfo.textContent = `Erro: ${error.message}`;
  });
});

updateUser().catch(error => {
  userInfo.textContent = `Erro: ${error.message}`;
});
