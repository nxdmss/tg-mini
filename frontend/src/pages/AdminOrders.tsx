import {useEffect,useState} from "react";
import {getAdminOrders,getApiErrorMessage,updateOrderStatus} from "../api";
import type {AdminOrder,OrderStatus} from "../types";
import {formatPrice} from "../utils";
import "./AdminStudio.css";
const labels:Record<OrderStatus,string>={PENDING:"Оформлен",PAID:"Оплачен",SHIPPED:"Отправлен",DONE:"Доставлен",CANCELLED:"Отменён"};
export default function AdminOrders(){
 const [orders,setOrders]=useState<AdminOrder[]>([]);const [error,setError]=useState("");const [busy,setBusy]=useState(true);const [saving,setSaving]=useState(false);
 useEffect(()=>{void getAdminOrders().then(setOrders).catch(e=>setError(getApiErrorMessage(e))).finally(()=>setBusy(false));},[]);
 async function change(id:string,status:OrderStatus){setSaving(true);setError("");try{await updateOrderStatus(id,status);setOrders(a=>a.map(o=>o.id===id?{...o,status}:o));}catch(e){setError(getApiErrorMessage(e));}finally{setSaving(false);}}
 return <main className="swag-admin swag-admin-orders"><div className="swag-admin__section-head"><h1>Заказы</h1><span>{busy ? "—" : orders.length}</span></div>{error&&<p className="swag-admin__error">{error}</p>}{busy?<p className="swag-admin__muted">Загрузка…</p>:orders.length?orders.map(o=><details key={o.id} className="swag-admin-orders__item"><summary><strong>№ {o.id.slice(0,8).toUpperCase()}</strong><span>{o.customerName||o.user?.name||"Гость"}</span><span className="swag-admin-orders__status">{labels[o.status]}</span><span className="swag-admin-orders__total">{formatPrice(o.items.reduce((n,i)=>n+i.price*i.quantity,0))}</span></summary><div className="swag-admin-orders__body"><p>{o.createdAt&&new Date(o.createdAt).toLocaleString("ru-RU")}</p><p>{[o.phone||o.user?.phone,o.user?.email,o.deliveryMethod,o.address,o.comment].filter(Boolean).join(" · ")}</p>{o.items.map(i=><p key={i.id}>{i.product.name} · {i.size} · {i.quantity} шт. · {formatPrice(i.price)}</p>)}<label className="swag-admin-orders__field">Статус<select aria-label="Статус" value={o.status} disabled={saving} onChange={e=>void change(o.id,e.target.value as OrderStatus)}>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div></details>):<p className="swag-admin__muted">Заказов пока нет</p>}</main>;
}
