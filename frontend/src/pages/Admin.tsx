import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getProducts, getBrands, getCategories, createBrand, createCategory, deleteProduct, getApiErrorMessage, type ProductImageItem } from "../api";
import { createAdminProduct, updateAdminProduct } from "../productAdminApi";
import { getShop, clearShopApiCache } from "../shopApi";
import { formatPrice, getProductPreviewImage, getProductPreviewSrcSet } from "../utils";
import type { Brand, Category, Product } from "../types";
import "./AdminStudio.css";

type DraftImage = ProductImageItem & { preview?: string };
type Draft = { id?: string; name: string; price: string; description: string; brandId: string; categoryId: string; sizes: string; inStock: boolean; images: DraftImage[] };
const fly = { duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] };
function fromProduct(p: Product): Draft {
  return { id:p.id, name:p.name, price:String(p.price), description:p.description ?? "", brandId:p.brand.id, categoryId:p.category.id, sizes:p.sizes.map(s=>s.size).join(", "), inStock:p.inStock, images:p.images.map(i=>({key:i.id,type:"url",url:i.url})) };
}
export default function Admin() {
  const reduced = useReducedMotion();
  const [products,setProducts] = useState<Product[]>([]);
  const [brands,setBrands] = useState<Brand[]>([]);
  const [categories,setCategories] = useState<Category[]>([]);
  const [shopId,setShopId] = useState("");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [draft,setDraft] = useState<Draft|null>(null);
  const [dirty,setDirty] = useState(false);
  const [saving,setSaving] = useState(false);
  const [newBrand,setNewBrand] = useState("");
  const [newCategory,setNewCategory] = useState("");
  const [query,setQuery] = useState("");
  const urls = useRef(new Set<string>());
  const panel = useRef<HTMLElement>(null);
  const opener = useRef<HTMLButtonElement|null>(null);
  const visible = products.filter(p=>p.name.toLowerCase().includes(query.trim().toLowerCase()));
  async function load() {
    setLoading(true);setError("");
    try {
      const [p,b,c,s] = await Promise.all([getProducts({sort:"newest"}),getBrands(),getCategories(),getShop("swagystan")]);
      setProducts(p);setBrands(b);setCategories(c);setShopId(s.id);
    } catch(e) {setError(getApiErrorMessage(e));} finally {setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  useEffect(()=>{const previews=urls.current;return ()=>{previews.forEach(u=>URL.revokeObjectURL(u));previews.clear();};},[]);
  useEffect(()=>{if(!dirty)return;const fn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",fn);return ()=>window.removeEventListener("beforeunload",fn);},[dirty]);
  function release() {urls.current.forEach(u=>URL.revokeObjectURL(u));urls.current.clear();}
  function canDiscard(){return !saving && (!dirty || window.confirm("Закрыть без сохранения?"));}
  function choose(p?:Product, button?:HTMLButtonElement) {
    if (p && draft?.id===p.id) return;
    if (!canDiscard()) return;
    release();setError("");setNewBrand("");setNewCategory("");
    setDraft(p?fromProduct(p):{name:"",price:"",description:"",brandId:"",categoryId:"",sizes:"",inStock:true,images:[]});
    setDirty(false);opener.current=button??null;
    if(panel.current)panel.current.scrollTop=0;
  }
  function close(){if(!canDiscard())return;release();setDraft(null);setDirty(false);setError("");opener.current?.focus({preventScroll:true});}
  function patch(v:Partial<Draft>){setDraft(d=>d?{...d,...v}:d);setDirty(true);}
  function addImages(files:FileList|null){
    if(!draft||!files)return;
    const items:DraftImage[]=Array.from(files).filter(f=>f.type.startsWith("image/")).slice(0,Math.max(0,10-draft.images.length)).map(file=>{
      const preview=URL.createObjectURL(file);urls.current.add(preview);return {type:"file",file,key:crypto.randomUUID(),preview};
    });
    patch({images:[...draft.images,...items]});
  }
  function removeImage(key:string){
    if(!draft)return;
    const item=draft.images.find(i=>i.key===key);
    if(item?.preview){URL.revokeObjectURL(item.preview);urls.current.delete(item.preview);}
    patch({images:draft.images.filter(i=>i.key!==key)});
  }
  function moveImage(i:number,delta:number){
    if(!draft)return;const a=[...draft.images];const j=i+delta;
    if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];patch({images:a});
  }
  async function addRef(kind:"brand"|"category"){
    const name=(kind==="brand"?newBrand:newCategory).trim();if(!name||saving)return;
    setSaving(true);setError("");
    try{
      if(kind==="brand"){const b=await createBrand(name);setBrands(a=>[...a,b]);patch({brandId:b.id});setNewBrand("");}
      else{const c=await createCategory(name);setCategories(a=>[...a,c]);patch({categoryId:c.id});setNewCategory("");}
    }catch(e){setError(getApiErrorMessage(e));}finally{setSaving(false);}
  }
  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!draft||saving)return;
    const price=Number(draft.price);
    if(!shopId||!draft.name.trim()||!draft.price.trim()||!Number.isInteger(price)||price<0||price>2147483647||!draft.brandId||!draft.categoryId){setError("Заполни название, цену, бренд и категорию.");return;}
    setSaving(true);setError("");
    try{
      const data={shopId,name:draft.name.trim(),price,description:draft.description.trim(),brandId:draft.brandId,categoryId:draft.categoryId,inStock:draft.inStock,sizes:Array.from(new Set(draft.sizes.split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean))),imageItems:draft.images};
      const p=draft.id?await updateAdminProduct(draft.id,data):await createAdminProduct(data);
      setProducts(a=>draft.id?a.map(x=>x.id===p.id?p:x):[p,...a]);clearShopApiCache();release();setDraft(fromProduct(p));setDirty(false);
    }catch(e){setError(getApiErrorMessage(e));}finally{setSaving(false);}
  }
  async function remove(){
    if(!draft?.id||saving||!window.confirm("Удалить «"+draft.name+"»?"))return;
    const id=draft.id;setSaving(true);setError("");
    try{await deleteProduct(id);clearShopApiCache();setProducts(a=>a.filter(p=>p.id!==id));release();setDraft(null);setDirty(false);}
    catch(e){setError(getApiErrorMessage(e));}finally{setSaving(false);}
  }
  const t=reduced?{duration:0}:fly;
  return <main className={"swag-admin"+(draft?" is-editing":"")}>
    <div className="swag-admin__toolbar">
      <div className="swag-admin__search"><input aria-label="Поиск товара" placeholder="Поиск" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" onClick={()=>setQuery("")} aria-label="Очистить поиск">×</button>}</div>
      <button type="button" className="swag-admin__new" disabled={saving||loading} onClick={e=>choose(undefined,e.currentTarget)}>+ Товар</button>
    </div>
    {!draft&&error&&<p className="swag-admin__error" role="alert">{error} <button onClick={()=>void load()}>Повторить</button></p>}
    {loading?<p className="swag-admin__muted">Загрузка…</p>:<div className="swag-admin__grid">
      {visible.map(p=><motion.button layout="position" transition={t} type="button" key={p.id} aria-pressed={draft?.id===p.id} className={"swag-admin__card"+(draft?.id===p.id?" is-selected":"")} onClick={e=>choose(p,e.currentTarget)} disabled={saving}>
        <span className="swag-admin__media">{p.images[0]?<img src={getProductPreviewImage(p)} srcSet={getProductPreviewSrcSet(p)} sizes="(max-width: 740px) 33vw, 18vw" alt={p.name} loading="lazy" decoding="async"/>:<span className="swag-admin__muted">+</span>}{!p.inStock&&<span className="swag-admin__sold">SOLD OUT</span>}</span>
        <span className="swag-admin__name">{p.name}</span><span className="swag-admin__price">{formatPrice(p.price)}</span>
      </motion.button>)}
      {!visible.length&&<p className="swag-admin__muted">{query?"Ничего не найдено":"Пока нет товаров"}</p>}
    </div>}
    <AnimatePresence>{draft&&<motion.aside key="editor" ref={panel} className="swag-admin__editor" initial={reduced?false:{x:"100%",opacity:0}} animate={{x:0,opacity:1}} exit={{x:"100%",opacity:0}} transition={t} aria-label="Редактор товара">
      <div className="swag-admin__editor-head"><strong>{draft.id?"Товар":"Новый товар"}</strong><button type="button" aria-label="Закрыть" disabled={saving} onClick={close}>×</button></div>
      <form className="swag-admin__form" onSubmit={save}>
        <fieldset disabled={saving}>
          <div className="swag-admin__photos">
            {draft.images.map((i,n)=><div className="swag-admin__photo" key={i.key}><img src={i.type==="url"?i.url:i.preview} alt={"Фото "+(n+1)}/><button type="button" className="swag-admin__remove-photo" aria-label="Удалить фото" onClick={()=>removeImage(i.key)}>×</button><div className="swag-admin__photo-order"><button type="button" disabled={n===0} onClick={()=>moveImage(n,-1)} aria-label="Фото раньше">‹</button><button type="button" disabled={n===draft.images.length-1} onClick={()=>moveImage(n,1)} aria-label="Фото позже">›</button></div></div>)}
            {draft.images.length<10&&<label className="swag-admin__upload" title="Добавить фотографии">+<input aria-label="Добавить фотографии" type="file" accept="image/*" multiple onChange={e=>{addImages(e.target.files);e.target.value="";}}/></label>}
          </div>
          <label>Название<input required value={draft.name} onChange={e=>patch({name:e.target.value})}/></label>
          <label>Цена, ₽<input required type="number" min="0" max="2147483647" step="1" inputMode="numeric" value={draft.price} onChange={e=>patch({price:e.target.value})}/></label>
          <label>Размеры<input placeholder="S, M, L, XL" value={draft.sizes} onChange={e=>patch({sizes:e.target.value})}/></label>
          <label className="swag-admin__check"><input type="checkbox" checked={draft.inStock} onChange={e=>patch({inStock:e.target.checked})}/> В наличии</label>
          <label>Описание<textarea rows={4} value={draft.description} onChange={e=>patch({description:e.target.value})}/></label>
          <details key={draft.id??"new"} className="swag-admin__details" open={!draft.id?true:undefined}><summary>Бренд и категория</summary>
            <label>Бренд<select value={draft.brandId} onChange={e=>patch({brandId:e.target.value})}><option value="">Выбрать</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
            <div className="swag-admin__inline"><input aria-label="Новый бренд" placeholder="Новый бренд" value={newBrand} onChange={e=>setNewBrand(e.target.value)}/><button type="button" disabled={!newBrand.trim()} onClick={()=>void addRef("brand")}>+</button></div>
            <label>Категория<select value={draft.categoryId} onChange={e=>patch({categoryId:e.target.value})}><option value="">Выбрать</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <div className="swag-admin__inline"><input aria-label="Новая категория" placeholder="Новая категория" value={newCategory} onChange={e=>setNewCategory(e.target.value)}/><button type="button" disabled={!newCategory.trim()} onClick={()=>void addRef("category")}>+</button></div>
          </details>
        </fieldset>
        {error&&<p className="swag-admin__error" role="alert">{error}</p>}
        <div className="swag-admin__save-row"><button type="submit" className="swag-admin__primary" disabled={saving||!shopId||Boolean(draft.id&&!dirty)}>{saving?"Сохраняю…":dirty||!draft.id?"Сохранить":"Сохранено"}</button>{draft.id&&<button type="button" className="swag-admin__delete" disabled={saving} onClick={()=>void remove()}>Удалить</button>}</div>
        {draft.id&&<Link to={"/product/"+encodeURIComponent(draft.id)} target="_blank" rel="noopener noreferrer" className="swag-admin__view">Открыть на сайте ↗</Link>}
      </form>
    </motion.aside>}</AnimatePresence>
  </main>;
}
