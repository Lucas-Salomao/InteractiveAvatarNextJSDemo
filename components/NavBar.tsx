"use client";

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";

import { GithubIcon, SENAILogo } from "./Icons";
import { ThemeSwitch } from "./ThemeSwitch";

export default function NavBar() {
  return (
    <Navbar className="w-full">
      <NavbarBrand>
        <Link isExternal aria-label="HeyGen" href="https://www.sp.senai.br/">
          <SENAILogo />
        </Link>
        <div className="bg-red-500 bg-clip-text ml-4">
          <p className="text-xl font-semibold text-transparent">
            Tutor Virtual SENAI São Paulo
          </p>
        </div>
      </NavbarBrand>
      <NavbarContent justify="center">
        <NavbarItem className="flex flex-row items-center gap-4">
          {/* <Link
            isExternal
            color="foreground"
            href="https://labs.heygen.com/interactive-avatar"
          >
            Avatars
          </Link>
          <Link
            isExternal
            color="foreground"
            href="https://docs.heygen.com/reference/list-voices-v2"
          >
            Voices
          </Link>
          <Link
            isExternal
            color="foreground"
            href="https://docs.heygen.com/reference/new-session-copy"
          >
            API Docs
          </Link>
          <Link
            isExternal
            color="foreground"
            href="https://help.heygen.com/en/articles/9182113-interactive-avatar-101-your-ultimate-guide"
          >
            Guide
          </Link>
          <Link
            isExternal
            aria-label="Github"
            className="flex flex-row justify-center gap-1 text-foreground"
            href="https://github.com/HeyGen-Official/StreamingAvatarSDK"
          >
            <GithubIcon className="text-default-500" />
            SDK
          </Link> */}
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
