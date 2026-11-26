// Chave PÚBLICA de assinatura dos logins (é a mesma servida em
// https://<projeto>.supabase.co/auth/v1/.well-known/jwks.json — não é segredo).
//
// Embutida aqui para validar o login sem ir à internet: num servidor que
// acabou de "acordar" (cold start), o getClaims() buscava essa chave a cada
// primeira requisição. Se o Supabase trocar a chave, o getClaims() não acha o
// "kid" aqui e busca a nova sozinho — nada quebra.
export const JWKS_PUBLICO = {
  keys: [
    {
      alg: "ES256",
      crv: "P-256",
      ext: true,
      key_ops: ["verify"],
      kid: "8aa8de57-d08f-406b-a94b-6bafa73269c2",
      kty: "EC",
      use: "sig",
      x: "msSAsA4ufrjvmDgJwiy9K1vfPAKlnVoGoeXXgrhbevk",
      y: "j3WKWwPOu-874J81L-xsV6xM7_vVHyLdDhcvZHV17wU",
    },
  ],
};
