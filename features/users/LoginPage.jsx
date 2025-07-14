import { h, useState, useEffect, Fragment } from "../../assets/preact.esm.js"
import Input from "../../commons/components/Input.jsx";
import { ArrowRightIcon } from "../../commons/components/Icon.jsx";
import navigateTo from "../../commons/utils/navigateTo.js";
import ApiClient from "../../commons/http/ApiClient.js";

export default function LoginPage({ isOnboarding = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function handleEmailChange(e) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  function handleLoginClick() {
    event.preventDefault();
    
    setEmailError("");
    setPasswordError("");

    const payload = {
      email: email,
      password: password
    };

    const promise = isOnboarding ? ApiClient.createUser(payload) : ApiClient.login(payload);

    promise
      .then(() => {
        navigateTo("/notes/");
        window.location.reload();
      })
      .catch(e => {
        switch (e.code) {
          case "INVALID_EMAIL":
            setEmailError("Invalid email address");
            break;
          case "INVALID_PASSWORD":
            setPasswordError("Invalid password");
            break;
          case "INCORRECT_EMAIL":
            setEmailError("Incorrect email address");
            break;
          case "INCORRECT_PASSWORD":
            setPasswordError("Incorrect password");
            break;
        }
      });
  }

  let header = null;
  let buttonText = "Login";

  if (isOnboarding) {
    header = (
      <div>
        <div className="login-title">Let's get started!</div>
        <div className="login-subtitle">Create your admin account</div>
      </div>
    );
    buttonText = "Continue";
  } else {
    header = (
      <div>
        <div className="login-title">Login</div>
      </div>
    );
  }

  return (
    <>
      <form className="login-container" onSubmit={handleLoginClick}>
        {header}
        <Input id="email" label="Email" type="email" placeholder="Enter your email address" value={email} hint="" error={emailError} isDisabled={false} onChange={handleEmailChange} />
        <Input id="password" label="Password" type="password" placeholder="Enter your password" value={password} hint="" error={passwordError} isDisabled={false} onChange={handlePasswordChange} />
        <button className="button primary" type="submit" onClick={handleLoginClick}>{buttonText}<ArrowRightIcon /></button>
      </form>
      <div className="toast-root"></div>
    </>
  );
}