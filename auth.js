
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://woemdwjksfspjunzukre.supabase.co";
const SUPABASE_KEY = "sb_publishable_hcl46nJjacErmRsQSvheIA_Kte_tr5J";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const loginButton = document.querySelector("#login-button");
const userInfo = document.querySelector("#user-info");

async function updateUser() {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const name =
      user.user_metadata.full_name ||
      user.user_metadata.name ||
      user.email;

    userInfo.textContent = `Conectado como ${name}`;
    loginButton.textContent = "Sair";
  } else {
    userInfo.textContent = "";
    loginButton.textContent = "Entrar com Google";
  }
}

loginButton.addEventListener("click", async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
    await updateUser();
  } else {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://lightbusters.github.io/squad-busters-archive/"
      }
    });
  }
});

supabase.auth.onAuthStateChange(() => {
  updateUser();
});

updateUser();
  
