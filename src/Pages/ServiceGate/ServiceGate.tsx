import React, { useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import gsap from 'gsap';
import {
  canEnterApp,
  canOpenDesk,
  canOpenRoute,
  deskAccessFromCookie,
  homeRoute,
  menuAccessFromCookie,
} from '../../utils/roles';
import {
  crmHomeRoute,
  isCrmRole,
  stubCrmRoleFromUserType,
} from '../../crm/crmRoles';
import { rwGoldLogo, staffLoginBg } from '../../assets';
import '../Login/staff-auth.css';

const isAuthenticated = () => Boolean(Cookies.get('access_token'));

/**
 * First screen on admin.rajivwilliams.com:
 * professional choice between Ops Admin and Sales CRM.
 */
const ServiceGate: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        bgRef.current,
        { scale: 1.12, opacity: 0.5 },
        { scale: 1.04, opacity: 1, duration: 1.35, ease: 'power2.out' },
      );
      gsap.fromTo(
        cardRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.12 },
      );
      gsap.fromTo(
        '.rw-gate__card',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', stagger: 0.1, delay: 0.35 },
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  if (isAuthenticated()) {
    const role = Cookies.get('user_type');
    const menus = menuAccessFromCookie(Cookies.get('menu_access'));
    const desks = deskAccessFromCookie(Cookies.get('desk_access'));
    if (!canEnterApp(role, menus)) {
      Cookies.remove('access_token');
      Cookies.remove('user_type');
      Cookies.remove('user_name');
      Cookies.remove('crm_role');
      Cookies.remove('rw_service');
      Cookies.remove('menu_access');
      Cookies.remove('desk_access');
      Cookies.remove('user_department');
    } else {
      const preferred = Cookies.get('rw_service');
      const canCrm =
        canOpenDesk(role, 'crm', desks) && canOpenRoute(role, '/crm', menus);
      const canOps = canOpenDesk(role, 'admin', desks);
      const home = homeRoute(role, menus);

      if (preferred === 'crm' && canCrm) {
        const stored = Cookies.get('crm_role');
        const crmRole = isCrmRole(stored)
          ? stored
          : stubCrmRoleFromUserType(role);
        return <Navigate to={crmHomeRoute(crmRole)} replace />;
      }
      if (preferred === 'admin' && canOps) {
        return <Navigate to={home === '/crm' ? '/dashboard' : home} replace />;
      }
      if (canCrm && !canOps) {
        const stored = Cookies.get('crm_role');
        const crmRole = isCrmRole(stored)
          ? stored
          : stubCrmRoleFromUserType(role);
        return <Navigate to={crmHomeRoute(crmRole)} replace />;
      }
      if (!canCrm && canOps) {
        return <Navigate to={home === '/crm' ? '/dashboard' : home} replace />;
      }
    }
  }

  return (
    <div className="rw-auth rw-auth--gate" ref={rootRef}>
      <div
        ref={bgRef}
        className="rw-auth__bg"
        style={{ backgroundImage: `url(${staffLoginBg})` }}
      />
      <div className="rw-auth__veil" />
      <div className="rw-auth__grid" />

      <div className="rw-auth__stage rw-auth__stage--wide" ref={cardRef}>
        <div className="rw-auth__card">
          <div className="rw-auth__brand">
            <img src={rwGoldLogo} alt="Rajiv Williams" className="rw-auth__logo" />
            <p className="rw-auth__kicker">Team RW · Internal</p>
          </div>

          <h1 className="rw-auth__title">Choose your workspace</h1>
          <p className="rw-auth__lede">
            One staff account. Open Ops Admin for company systems, or Sales CRM for
            the mandate desk.
          </p>

          <div className="rw-gate__cards">
            <Link
              to="/login?service=admin"
              className="rw-gate__card"
              onClick={() => Cookies.set('rw_service', 'admin', { expires: 30 })}
            >
              <span className="rw-gate__card-kicker">Company systems</span>
              <strong className="rw-gate__card-title">Ops Admin</strong>
              <span className="rw-gate__card-copy">
                Projects, HR, payments, blogs, listings, and coaching enquiry tools.
              </span>
              <span className="rw-gate__card-cta">Continue to Admin →</span>
            </Link>

            <Link
              to="/login?service=crm"
              className="rw-gate__card"
              onClick={() => Cookies.set('rw_service', 'crm', { expires: 30 })}
            >
              <span className="rw-gate__card-kicker">Sales desk</span>
              <strong className="rw-gate__card-title">Sales CRM</strong>
              <span className="rw-gate__card-copy">
                My Day, leads, Team, and projects for salespeople, managers, and
                sales leads.
              </span>
              <span className="rw-gate__card-cta">Continue to CRM →</span>
            </Link>
          </div>

          <p className="rw-auth__foot">
            Same email and password for both. Access follows the seat Admin assigned.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceGate;
