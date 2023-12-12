export default function Goup(props:{onClick: Function, className?:string, fill?:string, stroke?:string}){
     return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={props.fill || 'currentColor'} className={props.className} onClick={()=>{props.onClick()}}>
  <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
</svg>

     )
}