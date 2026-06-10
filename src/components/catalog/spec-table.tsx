import type { ProductSpecRow } from "@/types";

export function SpecTable({ specs }: { specs: ProductSpecRow[] }) {
  if (specs.length === 0) return null;
  return (
    <table className="w-full text-sm">
      <tbody>
        {specs.map((spec, i) => (
          <tr key={spec.id} className={i % 2 === 0 ? "bg-muted/50" : undefined}>
            <th
              scope="row"
              className="w-36 px-3 py-2 text-left align-top font-medium text-muted-foreground sm:w-48"
            >
              {spec.name}
            </th>
            <td className="px-3 py-2 tabular-nums text-foreground">
              {spec.value}
              {spec.unit ? <span className="ml-1 text-muted-foreground">{spec.unit}</span> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
