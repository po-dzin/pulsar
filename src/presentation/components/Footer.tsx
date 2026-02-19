import type { Dictionary } from "@/presentation/i18n/dictionaries";

export const Footer = ({ dictionary }: { dictionary: Dictionary }) => (
  <footer>
    <div className="footer-inner">{dictionary.common.disclaimer}</div>
  </footer>
);
