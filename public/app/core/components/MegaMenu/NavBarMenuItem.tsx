import { css, cx } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconName, Link, useTheme2 } from '@grafana/ui';

export interface Props {
  children: React.ReactNode;
  icon?: IconName;
  isActive?: boolean;
  isChild?: boolean;
  onClick?: () => void;
  target?: HTMLAnchorElement['target'];
  url?: string;
}

export function NavBarMenuItem({ children, icon, isActive, isChild, onClick, target, url }: Props) {
  const theme = useTheme2();
  const styles = getStyles(theme, isActive, isChild);

  const linkContent = (
    <div className={styles.linkContent}>
      {icon && <Icon data-testid="dropdown-child-icon" name={icon} />}

      <div className={styles.linkText}>{children}</div>

      {target === '_blank' && (
        <Icon data-testid="external-link-icon" name="external-link-alt" className={styles.externalLinkIcon} />
      )}
    </div>
  );

  let element = (
    <button className={cx(styles.button, styles.element)} onClick={onClick}>
      {linkContent}
    </button>
  );

  if (url) {
    element =
      !target && url.startsWith('/') ? (
        <Link className={styles.element} href={url} target={target} onClick={onClick}>
          {linkContent}
        </Link>
      ) : (
        <a href={url} target={target} className={styles.element} onClick={onClick}>
          {linkContent}
        </a>
      );
  }

  return <li className={styles.listItem}>{element}</li>;
}

NavBarMenuItem.displayName = 'NavBarMenuItem';

const getStyles = (theme: GrafanaTheme2, isActive: Props['isActive'], isChild: Props['isActive']) => ({
  button: css({
    backgroundColor: 'unset',
    borderStyle: 'unset',
  }),
  linkContent: css({
    alignItems: 'center',
    display: 'flex',
    gap: '0.5rem',
    height: '100%',
    width: '100%',
  }),
  linkText: css({
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  }),
  externalLinkIcon: css({
    color: theme.colors.text.secondary,
  }),
  element: css({
    alignItems: 'center',
    boxSizing: 'border-box',
    color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
    padding: theme.spacing(1, 1, 1, isChild ? 7 : 0),
    width: '100%',
    '&:hover, &:focus-visible': {
      backgroundColor: theme.colors.action.hover,
      color: theme.colors.text.primary,
    },
    '&:focus-visible': {
      boxShadow: 'none',
      outline: `2px solid ${theme.colors.primary.main}`,
      outlineOffset: '-2px',
      transition: 'none',
    },
    '&::before': {
      display: isActive ? 'block' : 'none',
      content: '" "',
      height: theme.spacing(3),
      position: 'absolute',
      left: theme.spacing(1),
      top: '50%',
      transform: 'translateY(-50%)',
      width: theme.spacing(0.5),
      borderRadius: theme.shape.borderRadius(1),
      backgroundImage: theme.colors.gradients.brandVertical,
    },
  }),
  listItem: css({
    position: 'relative',
    display: 'flex',
    width: '100%',
  }),
});
