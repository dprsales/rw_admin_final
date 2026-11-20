import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import gsap from "gsap";
import ForgotPassword from "./ForgotPassword";
import { authLogin } from "../../api/services";
import { rwGoldLogo, staffLoginBg } from "../../assets";
import { canEnterApp, canOpenRoute, homeRoute } from "../../utils/roles";
import {
  crmHomeRoute,
  stubCrmRoleFromUserType,
} from "../../crm/crmRoles";
import "./staff-auth.css";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceParam = searchParams.get("service");
  const wantsCrm =
    serviceParam === "crm" ||
    (!serviceParam && Cookies.get("rw_service") === "crm");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!serviceParam) {
      setSearchParams(
        { service: Cookies.get("rw_service") === "crm" ? "crm" : "admin" },
        { replace: true },
      );
    }
  }, [serviceParam, setSearchParams]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        bgRef.current,
        { scale: 1.12, opacity: 0.55 },
        { scale: 1.04, opacity: 1, duration: 1.4, ease: "power2.out" },
      );
      gsap.fromTo(
        cardRef.current,
        { y: 36, opacity: 0, filter: "blur(8px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.85, ease: "power3.out", delay: 0.15 },
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const { mutate: loginUser, isPending } = useMutation({
    mutationFn: authLogin,
    onSuccess: (response) => {
      try {
        const { access_token, user_profile } = response.data;
        const userType = user_profile.usertype;

        if (!canEnterApp(userType)) {
          setError("This account does not have access to the staff app.");
          toast.error("This account does not have access to the staff app.");
          return;
        }

        const crmRole = stubCrmRoleFromUserType(userType);
        Cookies.set("access_token", access_token);
        Cookies.set("user_type", userType);
        Cookies.set("user_name", user_profile.name);
        Cookies.set("crm_role", crmRole);

        const canCrm = canOpenRoute(userType, "/crm");
        const openCrm = userType === "sales" || (wantsCrm && canCrm);

        if (wantsCrm && !canCrm && userType !== "sales") {
          setError("This account cannot open the sales CRM desk.");
          toast.error("This account cannot open the sales CRM desk.");
          Cookies.set("rw_service", "admin", { expires: 30 });
          navigate(homeRoute(userType));
          return;
        }

        if (openCrm) {
          Cookies.set("rw_service", "crm", { expires: 30 });
          toast.success("Welcome to the sales desk");
          navigate(crmHomeRoute(crmRole));
          return;
        }

        Cookies.set("rw_service", "admin", { expires: 30 });
        toast.success("Login successful!");
        const opsHome = homeRoute(userType);
        navigate(opsHome === "/crm" ? "/dashboard" : opsHome);
      } catch (err) {
        console.error(err);
        setError("Could not finish login. Try again.");
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
    onError: () => {
      setError("Invalid login details. Check email and password.");
      toast.error("Invalid login credentials. Please try again.");
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter email and password.");
      return;
    }
    loginUser({ email: email.trim(), password });
  };

  const setService = (service: "admin" | "crm") => {
    Cookies.set("rw_service", service, { expires: 30 });
    setSearchParams({ service }, { replace: true });
  };

  if (showForgotPassword) {
    return (
      <div className="rw-auth" ref={rootRef}>
        <div
          className="rw-auth__bg"
          style={{ backgroundImage: `url(${staffLoginBg})` }}
        />
        <div className="rw-auth__veil" />
        <div className="rw-auth__grid" />
        <div className="rw-auth__stage">
          <ForgotPassword
            setShowForgotPassword={setShowForgotPassword}
            setShowLogin={() => setShowForgotPassword(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rw-auth" ref={rootRef}>
      <div
        ref={bgRef}
        className="rw-auth__bg"
        style={{ backgroundImage: `url(${staffLoginBg})` }}
      />
      <div className="rw-auth__veil" />
      <div className="rw-auth__grid" />

      <div className="rw-auth__stage" ref={cardRef}>
        <div className="rw-auth__card">
          <div className="rw-auth__brand">
            <img src={rwGoldLogo} alt="Rajiv Williams" className="rw-auth__logo" />
            <p className="rw-auth__kicker">Team RW · Staff</p>
          </div>

          <div className="rw-auth__tabs" role="tablist" aria-label="Workspace">
            <button
              type="button"
              role="tab"
              aria-selected={!wantsCrm}
              className={`rw-auth__tab${!wantsCrm ? " is-on" : ""}`}
              onClick={() => setService("admin")}
            >
              Ops Admin
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={wantsCrm}
              className={`rw-auth__tab${wantsCrm ? " is-on" : ""}`}
              onClick={() => setService("crm")}
            >
              Sales CRM
            </button>
          </div>

          <h1 className="rw-auth__title">{wantsCrm ? "Sales CRM" : "Ops Admin"}</h1>
          <p className="rw-auth__lede">
            {wantsCrm
              ? "Sign in to your sales desk. My Day, leads, and Team."
              : "Sign in to company systems. Projects, people, and tools."}
          </p>

          <form onSubmit={onSubmit}>
            <div className="rw-auth__field">
              <label className="rw-auth__label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                className="rw-auth__input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@rajivwilliams.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>

            <div className="rw-auth__field">
              <label className="rw-auth__label" htmlFor="login-password">
                Password
              </label>
              <div className="rw-auth__input-wrap">
                <input
                  id="login-password"
                  className="rw-auth__input rw-auth__input--password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  className="rw-auth__eye"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
              </div>
            </div>

            <div className="rw-auth__row">
              <button
                type="button"
                className="rw-auth__link"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>

            {error ? <p className="rw-auth__error" id="login-error" role="alert">{error}</p> : null}

            <button className="rw-auth__submit" type="submit" disabled={isPending}>
              {isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="rw-auth__foot">
            Prefer the full chooser? <Link to="/">Open workspace gate</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
