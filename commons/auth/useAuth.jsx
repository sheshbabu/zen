import { h, useEffect, useState } from "../../assets/preact.esm.js";
import ApiClient from "../http/ApiClient.js";

export default function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowLogin, setShouldShowLogin] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    ApiClient.checkUser()
      .catch(e => {
        if (e.code === "NO_USERS") {
          setShouldShowOnboarding(true);
        } else if (e.code === "NO_SESSION") {
          setShouldShowLogin(true);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return {
    isLoading,
    shouldShowLogin,
    shouldShowOnboarding,
  };
}