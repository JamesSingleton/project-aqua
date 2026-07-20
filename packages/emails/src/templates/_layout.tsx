import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: ReactNode;
}

export function EmailLayout({ preview, heading, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Project Aqua</Text>
          </Section>
          <Heading style={h1}>{heading}</Heading>
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            Project Aqua — Competitive swim team management
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} style={button}>
      {children}
    </Link>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "560px",
};

const header = { padding: "0 40px" };
const logo = { fontSize: "20px", fontWeight: "700", color: "#0ea5e9" };
const h1 = { color: "#1a1a1a", fontSize: "24px", padding: "0 40px" };
const hr = { borderColor: "#e6ebf1", margin: "20px 40px" };
const footer = { color: "#8898aa", fontSize: "12px", padding: "0 40px" };
const button = {
  backgroundColor: "#0ea5e9",
  borderRadius: "6px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  margin: "16px 40px",
};

export const textStyle = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 40px",
};
