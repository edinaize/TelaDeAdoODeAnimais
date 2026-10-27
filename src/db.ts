export type Role = "adotante" | "protetor" | "ong";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  passwordHash: string;
};

export type Animal = {
  id: number;
  name: string;
  species: "Cão" | "Gato";
  breed: string;
  age: string;
  sex: "Macho" | "Fêmea";
  location: string;
  image: string;
  imagePosition?: string;
  new?: boolean;
  size?: string;
  traits?: string[];
  details?: string;
  contactPhone: string;
  ownerId: string;
  responsibleName?: string;
  status: "Disponível" | "Adotado";
};

export type Adoption = {
  id: string;
  animalId: number;
  ownerId: string;
  adopterName: string;
  date: string;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string) => ({ ok: false as const, error });

const KEYS = {
  users: "pata-amiga:users",
  animals: "pata-amiga:animals",
  favorites: "pata-amiga:favorites",
  adoptions: "pata-amiga:adoptions",
  session: "pata-amiga:session",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

async function sha256(text: string) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ---------- Fotos ---------- */
export function fileToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Imagem inválida"));
    };
    img.src = url;
  });
}

/* ---------- Usuários ---------- */
const getUsers = () => read<User[]>(KEYS.users, []);

export function getSessionUser(): User | null {
  const id = window.localStorage.getItem(KEYS.session);
  return getUsers().find((u) => u.id === id) ?? null;
}

export function logoutUser() {
  window.localStorage.removeItem(KEYS.session);
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}): Promise<Result<User>> {
  const users = getUsers();
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) return fail("Já existe uma conta com este e-mail.");
  const user: User = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    role: input.role,
    passwordHash: await sha256(input.password),
  };
  if (!write(KEYS.users, [...users, user])) return fail("Não foi possível salvar os dados.");
  window.localStorage.setItem(KEYS.session, user.id);
  return { ok: true, value: user };
}

export async function loginUser(email: string, password: string): Promise<Result<User>> {
  const hash = await sha256(password);
  const user = getUsers().find((u) => u.email === email.trim().toLowerCase());
  if (!user || user.passwordHash !== hash) return fail("E-mail ou senha incorretos.");
  window.localStorage.setItem(KEYS.session, user.id);
  return { ok: true, value: user };
}

export async function updateUser(
  id: string,
  input: { name: string; email: string; phone: string; password?: string },
): Promise<Result<User>> {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index < 0) return fail("Usuário não encontrado.");
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.id !== id && u.email === email)) {
    return fail("Este e-mail já está em uso por outra conta.");
  }
  const updated: User = {
    ...users[index],
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    passwordHash: input.password ? await sha256(input.password) : users[index].passwordHash,
  };
  users[index] = updated;
  if (!write(KEYS.users, users)) return fail("Não foi possível salvar os dados.");
  return { ok: true, value: updated };
}

/* ---------- Animais ---------- */
// Cole aqui o array `animals` que está hoje no App.tsx (os 6 animais, sem alterar nada).
const SEED: Omit<Animal, "contactPhone" | "ownerId" | "responsibleName" | "status">[] = [
  {
    id: 1,
    name: "Bento",
    species: "Cão",
    breed: "Vira-lata",
    age: "2 anos",
    sex: "Macho",
    location: "São Paulo, SP",
    image:
      "https://images.unsplash.com/photo-1629740067905-bd3f515aa739?auto=format&fit=crop&w=900&q=85",
    imagePosition: "center 32%",
    new: true,
  },
  {
    id: 2,
    name: "Luna",
    species: "Gato",
    breed: "Sem raça definida",
    age: "1 ano",
    sex: "Fêmea",
    location: "Campinas, SP",
    image:
      "https://images.unsplash.com/photo-1536589961747-e239b2abbec2?auto=format&fit=crop&w=900&q=85",
    imagePosition: "center 42%",
  },
  {
    id: 3,
    name: "Fred",
    species: "Cão",
    breed: "Mestiço",
    age: "3 anos",
    sex: "Macho",
    location: "Sorocaba, SP",
    image:
      "https://images.unsplash.com/photo-1658337922643-6e3d8751a8eb?auto=format&fit=crop&w=900&q=85",
    imagePosition: "center 35%",
  },
  {
    id: 4,
    name: "Amora",
    species: "Gato",
    breed: "Sem raça definida",
    age: "8 meses",
    sex: "Fêmea",
    location: "Jundiaí, SP",
    image:
      "https://images.unsplash.com/photo-1582725461742-8ecd962c260d?auto=format&fit=crop&w=900&q=85",
    imagePosition: "center 45%",
    new: true,
  },
  {
    id: 5,
    name: "Tobias",
    species: "Cão",
    breed: "Mestiço",
    age: "4 anos",
    sex: "Macho",
    location: "São Paulo, SP",
    image:
      "https://images.unsplash.com/photo-1593991910379-b414c1e3bd74?auto=format&fit=crop&w=900&q=85",
    imagePosition: "center 35%",
  },
  {
    id: 6,
    name: "Nina",
    species: "Gato",
    breed: "Sem raça definida",
    age: "2 anos",
    sex: "Fêmea",
    location: "Osasco, SP",
    image:
      "https://images.unsplash.com/photo-1583795128727-6ec3642408f8?auto=format&fit=crop&w=900&q=85",
    imagePosition: "center 45%",
  },
];

export function getAnimals(): Animal[] {
  const stored = read<Animal[] | null>(KEYS.animals, null);
  if (stored) return stored;
  const seeded: Animal[] = SEED.map((a) => ({
    ...a,
    contactPhone: "(11) 90000-0000",
    ownerId: "seed",
    responsibleName: "Equipe Pata Amiga",
    status: "Disponível",
  }));
  write(KEYS.animals, seeded);
  return seeded;
}

export function getOwnerName(animal: Animal) {
  return (
    getUsers().find((u) => u.id === animal.ownerId)?.name ??
    animal.responsibleName ??
    "Responsável"
  );
}

export function addAnimal(
  input: Pick<
    Animal,
    "name" | "species" | "age" | "sex" | "size" | "traits" | "location" | "details" | "contactPhone" | "image"
  >,
  owner: User,
): Result<Animal> {
  const animal: Animal = {
    ...input,
    id: Date.now(),
    breed: "Sem raça definida",
    imagePosition: "center 40%",
    new: true,
    ownerId: owner.id,
    status: "Disponível",
  };
  if (!write(KEYS.animals, [animal, ...getAnimals()])) {
    return fail("Não foi possível salvar (foto muito grande ou armazenamento cheio).");
  }
  return { ok: true, value: animal };
}

export function adoptAnimal(animalId: number, userId: string, adopterName: string): Result<Animal> {
  const animals = getAnimals();
  const index = animals.findIndex((a) => a.id === animalId);
  if (index < 0) return fail("Animal não encontrado.");
  if (animals[index].ownerId !== userId) return fail("Apenas o responsável pode registrar a adoção.");
  animals[index] = { ...animals[index], status: "Adotado", new: false };
  const adoption: Adoption = {
    id: crypto.randomUUID(),
    animalId,
    ownerId: userId,
    adopterName: adopterName.trim(),
    date: new Date().toISOString(),
  };
  write(KEYS.adoptions, [...read<Adoption[]>(KEYS.adoptions, []), adoption]);
  if (!write(KEYS.animals, animals)) return fail("Não foi possível salvar.");
  return { ok: true, value: animals[index] };
}

/* ---------- Favoritos ---------- */
export function getFavorites(userId: string): number[] {
  return read<Record<string, number[]>>(KEYS.favorites, {})[userId] ?? [];
}

export function toggleFavorite(userId: string, animalId: number): number[] {
  const all = read<Record<string, number[]>>(KEYS.favorites, {});
  const current = all[userId] ?? [];
  all[userId] = current.includes(animalId)
    ? current.filter((id) => id !== animalId)
    : [...current, animalId];
  write(KEYS.favorites, all);
  return all[userId];
}