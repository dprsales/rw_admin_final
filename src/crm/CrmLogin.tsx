import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { authLogin } from '../api/services';
import { canEnterApp, canOpenDesk, canOpenRoute } from '../utils/roles';
import {
  CRM_ROLE_LABELS,
  CRM_ROLES,
  CrmRole,
  crmHomeRoute,
  stubCrmRoleFromUserType,
} from './crmRoles';
import './crm.css';

/**
 * Day 15: graphite / champagne gold sales desk login.
 * Same API auth as ops login; redirects into /crm by CRM seat.
 */
const CrmLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [seat, setSeat] = useState<'auto' | CrmRole>('auto');
  const [error, setError] = useState('');

  const { mutate: loginUser, isPending } = useMutation({
    mutationFn: authLogin,
    onSuccess: (response) => {
      try {
        const { access_token, user_profile } = response.data;
        const userType = user_profile?.usertype;
        const menuAccess = Array.isArray(user_profile?.menuAccess)
          ? user_profile.menuAccess.map(String)
          : null;
        const deskAccess = Array.isArray(user_profile?.deskAccess)
          ? user_profile.deskAccess.map(String)
          : null;

        if (!canEnterApp(userType, menuAccess)) {
          setError('This account does not have access to the staff app.');
          toast.error('This account does not have access to the staff app.');
          return;
        }

        if (
          !canOpenDesk(userType, 'crm', deskAccess) ||
          !canOpenRoute(userType, '/crm', menuAccess)
        ) {
          setError('This account cannot open the sales desk yet.');
          toast.error('This account cannot open the sales desk yet.');
          return;
        }

        const crmRole =
          seat === 'auto' ? stubCrmRoleFromUserType(userType) : seat;

        Cookies.set('access_token', access_token);
        Cookies.set('user_type', userType);
        Cookies.set('user_name', user_profile.name);
        Cookies.set('crm_role', crmRole);
        Cookies.set(
          'menu_access',
          menuAccess ? JSON.stringify(menuAccess) : '',
        );
        Cookies.set(
          'desk_access',
          deskAccess ? JSON.stringify(deskAccess) : '',
        );
        Cookies.set('user_department', user_profile.department || '');

        toast.success('Welcome to the sales desk');
        navigate(crmHomeRoute(crmRole), { replace: true });
      } catch (err) {
        console.error(err);
        setError('Could not finish login. Try again.');
        toast.error('Could not finish login. Try again.');
      }
    },
    onError: () => {
      setError('Invalid login details. Check email and password.');
      toast.error('Invalid login details.');
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter email and password.');
      return;
    }
    loginUser({ email: email.trim(), password });
  };

  return (
    <div className="crm-login">
      <div className="crm-login__panel">
        <p className="crm-kicker">Team RW · Sales desk</p>
        <h1 className="crm-title">Sign in</h1>
        <p className="crm-sub">
          Mandate pipeline desk. Same staff login. No HR or payments menu here.
        </p>

        <form className="crm-login__form" onSubmit={onSubmit}>
          <label className="crm-login__label" htmlFor="crm-email">
            Email
          </label>
          <input
            id="crm-email"
            className="crm-login__input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@rajivwilliams.com"
          />

          <label className="crm-login__label" htmlFor="crm-password">
            Password
          </label>
          <div className="crm-login__password-row">
            <input
              id="crm-password"
              className="crm-login__input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button
              type="button"
              className="crm-login__ghost"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <label className="crm-login__label" htmlFor="crm-seat">
            Desk seat (stub until hierarchy API)
          </label>
          <select
            id="crm-seat"
            className="crm-login__input"
            value={seat}
            onChange={(e) => setSeat(e.target.value as 'auto' | CrmRole)}
          >
            <option value="auto">From account (auto)</option>
            {CRM_ROLES.map((role) => (
              <option key={role} value={role}>
                {CRM_ROLE_LABELS[role]}
              </option>
            ))}
          </select>

          {error ? <p className="crm-login__error">{error}</p> : null}

          <button className="crm-btn crm-login__submit" type="submit" disabled={isPending}>
            {isPending ? 'Signing in…' : 'Open sales desk'}
          </button>
        </form>

        <p className="crm-login__foot">
          Ops admin login stays at <Link to="/login">/login</Link>
        </p>
      </div>
    </div>
  );
};

export default CrmLogin;
