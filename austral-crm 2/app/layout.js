import './globals.css';

export const metadata = {
  title: 'Austral Timber — CRM',
  description: 'Gulf outreach CRM for Austral Timber Partners',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
