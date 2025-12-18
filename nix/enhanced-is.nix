{
  pkgs,
  inputs,
  ...
}: let
  bun2nix = inputs.bun2nix.packages.${pkgs.stdenv.hostPlatform.system}.default;
in
  pkgs.stdenv.mkDerivation rec {
    name = "enhanced-is";
    version = "1.0.0";

    src = builtins.path {
      path = ../.;
      inherit name;
    };

    nativeBuildInputs = with pkgs; [
      bun2nix.hook
      zip
    ];

    bunDeps = bun2nix.fetchBunDeps {
      bunNix = ../bun.nix;
    };

    buildPhase =
      # bash
      ''
        bun run build
      '';

    installPhase =
      # bash
      ''
        mkdir -p $out
        cd dist
        zip -r $out/enhanced-is-${version}.zip .
      '';
  }
