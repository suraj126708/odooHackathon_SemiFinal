/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchDirectoryUsers,
  sendUserPasswordInvite,
} from "@/services/admin/usersApi";

const newKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const emptyRow = () => ({
  key: newKey(),
  userName: "",
  userId: null,
  role: "employee",
  managerName: "",
  managerId: null,
  email: "",
});

const selectClass = cn(
  "flex h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm",
  "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

function SearchablePerson({
  value,
  onPick,
  directory,
  onlyRole,
  placeholder,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const options = useMemo(() => {
    let list = onlyRole
      ? directory.filter((u) => u.role === onlyRole)
      : directory;
    const q = value.trim().toLowerCase();
    if (!q) return list.slice(0, 10);
    return list
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [directory, value, onlyRole]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const exact = directory.some(
    (u) => u.name.toLowerCase() === value.trim().toLowerCase()
  );
  const canCreate = value.trim().length >= 2 && !exact;

  return (
    <div className="relative min-w-[160px]" ref={wrapRef}>
      <Input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          onPick({ name: e.target.value, id: null });
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-8 bg-background"
        autoComplete="off"
      />
      {open && (
        <ul
          className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-auto rounded-md border border-border bg-popover py-1 text-sm shadow-md ring-1 ring-foreground/10"
          role="listbox"
        >
          {options.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="w-full px-2 py-1.5 text-left hover:bg-accent"
                onClick={() => {
                  onPick({ name: u.name, id: u.id });
                  setOpen(false);
                }}
              >
                <span className="font-medium">{u.name}</span>
                <span className="ml-2 text-muted-foreground">{u.email}</span>
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                type="button"
                className="w-full px-2 py-1.5 text-left text-primary hover:bg-accent"
                onClick={() => {
                  onPick({ name: value.trim(), id: null });
                  setOpen(false);
                }}
              >
                Create &quot;{value.trim()}&quot;
              </button>
            </li>
          )}
          {!options.length && !canCreate && value.trim() && (
            <li className="px-2 py-2 text-muted-foreground">No matches</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function Adduser() {
  const [rows, setRows] = useState(() => [emptyRow()]);
  const [directory, setDirectory] = useState([]);
  const [loadingDir, setLoadingDir] = useState(true);
  const [sendingKey, setSendingKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDir(true);
      try {
        const list = await fetchDirectoryUsers();
        if (!cancelled) setDirectory(list);
      } catch {
        if (!cancelled) setDirectory([]);
      } finally {
        if (!cancelled) setLoadingDir(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateRow = useCallback((key, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  }, []);

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const emailOk = (email) => /\S+@\S+\.\S+/.test(email.trim());

  const handleSendPassword = async (row) => {
    if (!row.userName.trim()) {
      toast.error("Enter a user name.");
      return;
    }
    if (!emailOk(row.email)) {
      toast.error("Enter a valid email.");
      return;
    }
    setSendingKey(row.key);
    try {
      await sendUserPasswordInvite({
        userName: row.userName.trim(),
        userId: row.userId,
        email: row.email.trim().toLowerCase(),
        role: row.role,
        managerName: row.managerName.trim() || undefined,
        managerId: row.managerId,
        createUserIfNew: !row.userId,
        createManagerIfNew: Boolean(row.managerName.trim() && !row.managerId),
      });
      toast.success("Password email sent. The user can sign in and change it.");
    } catch (e) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Could not send password email."
      );
    } finally {
      setSendingKey(null);
    }
  };

  return (
    <div className="page-shell">
      <Card className="surface-glow mx-auto max-w-6xl border-cyan-500/15">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <CardTitle className="text-xl font-semibold">Users</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Add people, assign roles and manager, then send a temporary
              password by email.
            </p>
          </div>
          <Button type="button" size="sm" className="shadow-glow-sm" onClick={addRow}>
            New
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingDir && (
            <p className="mb-4 text-sm text-muted-foreground">
              Loading directory…
            </p>
          )}
          <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/40">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-3 font-medium text-muted-foreground">
                    User (name)
                  </th>
                  <th className="px-3 py-3 font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="px-3 py-3 font-medium text-muted-foreground">
                    Manager
                  </th>
                  <th className="px-3 py-3 font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-3 py-3 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-3 py-3 align-top">
                      <SearchablePerson
                        value={row.userName}
                        onPick={({ name, id }) =>
                          updateRow(row.key, { userName: name, userId: id })
                        }
                        directory={directory}
                        onlyRole={null}
                        placeholder="Search or create…"
                        disabled={!!sendingKey}
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <select
                        className={selectClass}
                        value={row.role}
                        disabled={!!sendingKey}
                        onChange={(e) =>
                          updateRow(row.key, { role: e.target.value })
                        }
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <SearchablePerson
                        value={row.managerName}
                        onPick={({ name, id }) =>
                          updateRow(row.key, {
                            managerName: name,
                            managerId: id,
                          })
                        }
                        directory={directory}
                        onlyRole="manager"
                        placeholder="Manager…"
                        disabled={!!sendingKey}
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Input
                        type="email"
                        className="h-8 bg-background"
                        placeholder="marc@gmail.com"
                        value={row.email}
                        disabled={!!sendingKey}
                        onChange={(e) =>
                          updateRow(row.key, { email: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!!sendingKey}
                        onClick={() => handleSendPassword(row)}
                      >
                        {sendingKey === row.key ? "Sending…" : "Send password"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
