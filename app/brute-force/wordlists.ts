export type WordlistMeta = {
  key: string;
  name: string;
  file: string;
};

// Wordlists are stored as .txt files under public/wordlists
// Add any new files there and they'll appear in the simulator
export const WORDLISTS: readonly WordlistMeta[] = [
  { key: "100k-common", name: "100k-common", file: "/wordlists/100k-most-used-passwords-NCSC.txt" },
  { key: "10k-common", name: "10k-common", file: "/wordlists/10k-most-common.txt" },
  { key: "2024-common", name: "2024-common", file: "/wordlists/2024-197_most_used_passwords.txt" },
  { key: "defaults", name: "defaults", file: "/wordlists/default-passwords.txt" },
  { key: "rockyou", name: "rockyou", file: "/wordlists/rockyou.txt" },
];
