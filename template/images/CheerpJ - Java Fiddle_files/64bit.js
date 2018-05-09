(function(){
	"use strict";
	/*Compiled using Cheerp (R) by Leaning Technologies Ltd*/
	var __imul=Math.imul;
	var __fround=Math.fround;
	var add64=_add64;
	var sub64=_sub64;
	var mul64=_mul64;
	var sdiv64=_sdiv64;
	var srem64=_srem64;
	var aSlot=null;var oSlot=0;var nullArray=[null];var nullObj={d:nullArray,o:0};
	function _add64(Lal,Lah,Lbl,Lbh){
		hSlot=(Lbh+Lah|0)+((Lal>>>0>(Lbl^-1)>>>0?1:0)?1:0)|0;
		return Lbl+Lal|0;
	}
	function _sub64(Lal,Lah,Lbl,Lbh){
		hSlot=(Lah-Lbh|0)+((Lal>>>0<Lbl>>>0?1:0)<<31>>31)|0;
		return Lal-Lbl|0;
	}
	function _mul64(Lal,Lah,Lbl,Lbh){
		var tmp0=0,tmp1=0,tmp2=0,tmp3=0,tmp4=0,tmp5=0,tmp6=0,tmp7=0,tmp8=0,tmp9=0,tmp10=0;
		tmp0=Lah&65535;
		tmp1=Lal>>>16;
		tmp2=Lal&65535;
		tmp3=Lbh&65535;
		tmp4=Lbl>>>16;
		tmp5=Lbl&65535;
		tmp6=__imul(tmp5,tmp1)|0;
		tmp7=__imul(tmp4,tmp2)|0;
		tmp8=tmp6+tmp7|0;
		tmp9=__imul(tmp5,tmp2)|0;
		tmp10=tmp8<<16;
		hSlot=(((((__imul(tmp4,tmp1)|0)+(__imul(tmp5,tmp0)|0)|0)+(__imul(tmp3,tmp2)|0)|0)+(tmp8>>>16)|0)+((tmp10>>>0>(tmp9^-1)>>>0?1:0)?1:0)|0)+(((((__imul(tmp4,tmp0)|0)+(__imul(tmp5,Lah>>>16)|0)|0)+(__imul(Lbh>>>16,tmp2)|0)|0)+(__imul(tmp3,tmp1)|0)|0)+((tmp6>>>0>(tmp7^-1)>>>0?1:0)?1:0)<<16)|0;
		return tmp10+tmp9|0;
	}
	function _sdiv64(Lal,Lah,Lbl,Lbh){
		var tmp0=null,tmp1=0,tmp2=0;
		tmp0=aSlot=new Int32Array(2);
		___divti3(tmp0,0,Lah,Lal,Lbh,Lbl);
		tmp1=tmp0[0]|0;
		tmp2=tmp0[1]|0;
		hSlot=tmp1;
		return tmp2|0;
	}
	function _srem64(Lal,Lah,Lbl,Lbh){
		var tmp0=null,tmp1=0,tmp2=0;
		tmp0=aSlot=new Int32Array(2);
		___modti3(tmp0,0,Lah,Lal,Lbh,Lbl);
		tmp1=tmp0[0]|0;
		tmp2=tmp0[1]|0;
		hSlot=tmp1;
		return tmp2|0;
	}
	function ___modti3(Lagg$presult,Magg$presult,Lnumerator$pval,Lnumerator$p1$pval,Ldenominator$pval,Ldenominator$p1$pval){
		var L$psroa$p016$p0=0,L$psroa$p517$p0=0,Lsign$p0=0,L$psroa$p015$p0=0,L$psroa$p5$p0=0,Lbit$psroa$p8$p0$plcssa$pi=0,Lbit$psroa$p0$p0$plcssa$pi=0,tmp7=0;
		if((Lnumerator$pval|0)<0){
			L$psroa$p517$p0=0-Lnumerator$p1$pval|0;
			L$psroa$p016$p0=(Lnumerator$p1$pval|0)!==0?Lnumerator$pval^-1|0:0-Lnumerator$pval|0;
			Lsign$p0=1;
		}else{
			Lsign$p0=0;
			L$psroa$p517$p0=Lnumerator$p1$pval;
			L$psroa$p016$p0=Lnumerator$pval;
		}
		if((Ldenominator$pval|0)<0){
			L$psroa$p5$p0=0-Ldenominator$p1$pval|0;
			L$psroa$p015$p0=(Ldenominator$p1$pval|0)!==0?Ldenominator$pval^-1|0:0-Ldenominator$pval|0;
		}else{
			L$psroa$p5$p0=Ldenominator$p1$pval;
			L$psroa$p015$p0=Ldenominator$pval;
		}
		if((L$psroa$p015$p0|0)>-1&&(L$psroa$p015$p0>>>0<L$psroa$p016$p0>>>0||(L$psroa$p015$p0|0)===(L$psroa$p016$p0|0)&&L$psroa$p5$p0>>>0<L$psroa$p517$p0>>>0)){
			Lbit$psroa$p0$p0$plcssa$pi=0;
			Lbit$psroa$p8$p0$plcssa$pi=1;
			while(1){
				L$psroa$p015$p0=L$psroa$p015$p0<<1|L$psroa$p5$p0>>>31;
				L$psroa$p5$p0=L$psroa$p5$p0<<1;
				Lbit$psroa$p0$p0$plcssa$pi=Lbit$psroa$p0$p0$plcssa$pi<<1|Lbit$psroa$p8$p0$plcssa$pi>>>31;
				Lbit$psroa$p8$p0$plcssa$pi=Lbit$psroa$p8$p0$plcssa$pi<<1;
				if(!((L$psroa$p015$p0|0)>-1&&(L$psroa$p015$p0>>>0<L$psroa$p016$p0>>>0||L$psroa$p5$p0>>>0<L$psroa$p517$p0>>>0&&(L$psroa$p015$p0|0)===(L$psroa$p016$p0|0))&&(Lbit$psroa$p0$p0$plcssa$pi|Lbit$psroa$p8$p0$plcssa$pi|0)!==0)){
					break;
				}
			}
		}else{
			Lbit$psroa$p0$p0$plcssa$pi=0;
			Lbit$psroa$p8$p0$plcssa$pi=1;
		}
		if(!((Lbit$psroa$p0$p0$plcssa$pi|Lbit$psroa$p8$p0$plcssa$pi|0)===0)){
			while(1){
				if(L$psroa$p016$p0>>>0>L$psroa$p015$p0>>>0||L$psroa$p517$p0>>>0>=L$psroa$p5$p0>>>0&&(L$psroa$p016$p0|0)===(L$psroa$p015$p0|0)){
					tmp7=L$psroa$p517$p0-L$psroa$p5$p0|0;
					L$psroa$p016$p0=(L$psroa$p016$p0-L$psroa$p015$p0|0)+((L$psroa$p517$p0>>>0<L$psroa$p5$p0>>>0?1:0)<<31>>31)|0;
					L$psroa$p517$p0=tmp7;
				}
				tmp7=Lbit$psroa$p0$p0$plcssa$pi>>>1;
				Lbit$psroa$p8$p0$plcssa$pi=Lbit$psroa$p0$p0$plcssa$pi<<31|Lbit$psroa$p8$p0$plcssa$pi>>>1;
				Lbit$psroa$p0$p0$plcssa$pi=L$psroa$p015$p0>>>1;
				L$psroa$p5$p0=L$psroa$p015$p0<<31|L$psroa$p5$p0>>>1;
				if((Lbit$psroa$p8$p0$plcssa$pi|tmp7|0)===0){
					break;
				}else{
					L$psroa$p015$p0=Lbit$psroa$p0$p0$plcssa$pi;
					Lbit$psroa$p0$p0$plcssa$pi=tmp7;
				}
			}
		}
		if(!((Lsign$p0|0)===0)){
			Lsign$p0=0-L$psroa$p517$p0|0;
			L$psroa$p016$p0=(L$psroa$p517$p0|0)!==0?L$psroa$p016$p0^-1|0:0-L$psroa$p016$p0|0;
			L$psroa$p517$p0=Lsign$p0;
		}
		Lagg$presult[Magg$presult]=L$psroa$p016$p0;
		Lagg$presult[Magg$presult+1|0]=L$psroa$p517$p0;
		return;
	}
	function ___divti3(Lagg$presult,Magg$presult,Lnumerator$pval,Lnumerator$p1$pval,Ldenominator$pval,Ldenominator$p1$pval){
		var L$psroa$p016$p0=0,L$psroa$p517$p0=0,Lsign$p0=0,L$psroa$p5$p0=0,Lsign$p1=0,Lbit$psroa$p8$p0$plcssa$pi=0,Lbit$psroa$p0$p0$plcssa$pi=0,Lres$psroa$p4$p029$pi=0,Lres$psroa$p0$p028$pi=0,tmp9=0,tmp10=0,tmp11=0;
		if((Lnumerator$pval|0)<0){
			L$psroa$p517$p0=0-Lnumerator$p1$pval|0;
			L$psroa$p016$p0=(Lnumerator$p1$pval|0)!==0?Lnumerator$pval^-1|0:0-Lnumerator$pval|0;
			Lsign$p0=1;
		}else{
			Lsign$p0=0;
			L$psroa$p517$p0=Lnumerator$p1$pval;
			L$psroa$p016$p0=Lnumerator$pval;
		}
		if((Ldenominator$pval|0)<0){
			L$psroa$p5$p0=0-Ldenominator$p1$pval|0;
			Lbit$psroa$p8$p0$plcssa$pi=(Ldenominator$p1$pval|0)!==0?Ldenominator$pval^-1|0:0-Ldenominator$pval|0;
			Lsign$p1=Lsign$p0^1;
			Lsign$p0=Lbit$psroa$p8$p0$plcssa$pi;
		}else{
			Lsign$p1=Lsign$p0;
			L$psroa$p5$p0=Ldenominator$p1$pval;
			Lsign$p0=Ldenominator$pval;
		}
		if((Lsign$p0|0)>-1&&(Lsign$p0>>>0<L$psroa$p016$p0>>>0||(Lsign$p0|0)===(L$psroa$p016$p0|0)&&L$psroa$p5$p0>>>0<L$psroa$p517$p0>>>0)){
			Lbit$psroa$p0$p0$plcssa$pi=0;
			Lbit$psroa$p8$p0$plcssa$pi=1;
			while(1){
				Lsign$p0=Lsign$p0<<1|L$psroa$p5$p0>>>31;
				L$psroa$p5$p0=L$psroa$p5$p0<<1;
				Lbit$psroa$p0$p0$plcssa$pi=Lbit$psroa$p0$p0$plcssa$pi<<1|Lbit$psroa$p8$p0$plcssa$pi>>>31;
				Lbit$psroa$p8$p0$plcssa$pi=Lbit$psroa$p8$p0$plcssa$pi<<1;
				if(!((Lsign$p0|0)>-1&&(Lsign$p0>>>0<L$psroa$p016$p0>>>0||L$psroa$p5$p0>>>0<L$psroa$p517$p0>>>0&&(Lsign$p0|0)===(L$psroa$p016$p0|0))&&(Lbit$psroa$p0$p0$plcssa$pi|Lbit$psroa$p8$p0$plcssa$pi|0)!==0)){
					break;
				}
			}
		}else{
			Lbit$psroa$p0$p0$plcssa$pi=0;
			Lbit$psroa$p8$p0$plcssa$pi=1;
		}
		if((Lbit$psroa$p0$p0$plcssa$pi|Lbit$psroa$p8$p0$plcssa$pi|0)===0){
			L$psroa$p517$p0=0;
			L$psroa$p016$p0=0;
		}else{
			Lres$psroa$p0$p028$pi=0;
			Lres$psroa$p4$p029$pi=0;
			while(1){
				if(L$psroa$p016$p0>>>0>Lsign$p0>>>0||L$psroa$p517$p0>>>0>=L$psroa$p5$p0>>>0&&(L$psroa$p016$p0|0)===(Lsign$p0|0)){
					tmp9=L$psroa$p517$p0-L$psroa$p5$p0|0;
					tmp10=(L$psroa$p016$p0-Lsign$p0|0)+((L$psroa$p517$p0>>>0<L$psroa$p5$p0>>>0?1:0)<<31>>31)|0;
					L$psroa$p517$p0=Lres$psroa$p0$p028$pi|Lbit$psroa$p0$p0$plcssa$pi;
					L$psroa$p016$p0=Lres$psroa$p4$p029$pi|Lbit$psroa$p8$p0$plcssa$pi;
					Lres$psroa$p0$p028$pi=tmp9;
					Lres$psroa$p4$p029$pi=tmp10;
				}else{
					tmp9=L$psroa$p016$p0;
					tmp10=L$psroa$p517$p0;
					L$psroa$p517$p0=Lres$psroa$p0$p028$pi;
					Lres$psroa$p0$p028$pi=tmp10;
					L$psroa$p016$p0=Lres$psroa$p4$p029$pi;
					Lres$psroa$p4$p029$pi=tmp9;
				}
				tmp9=Lbit$psroa$p0$p0$plcssa$pi>>>1;
				Lbit$psroa$p8$p0$plcssa$pi=Lbit$psroa$p0$p0$plcssa$pi<<31|Lbit$psroa$p8$p0$plcssa$pi>>>1;
				Lbit$psroa$p0$p0$plcssa$pi=Lsign$p0>>>1;
				L$psroa$p5$p0=Lsign$p0<<31|L$psroa$p5$p0>>>1;
				if((Lbit$psroa$p8$p0$plcssa$pi|tmp9|0)===0){
					break;
				}else{
					tmp10=L$psroa$p016$p0;
					tmp11=L$psroa$p517$p0;
					Lsign$p0=Lbit$psroa$p0$p0$plcssa$pi;
					Lbit$psroa$p0$p0$plcssa$pi=tmp9;
					L$psroa$p517$p0=Lres$psroa$p0$p028$pi;
					Lres$psroa$p0$p028$pi=tmp11;
					L$psroa$p016$p0=Lres$psroa$p4$p029$pi;
					Lres$psroa$p4$p029$pi=tmp10;
				}
			}
		}
		if(!((Lsign$p1|0)===0)){
			Lsign$p0=0-L$psroa$p016$p0|0;
			L$psroa$p517$p0=(L$psroa$p016$p0|0)!==0?L$psroa$p517$p0^-1|0:0-L$psroa$p517$p0|0;
			L$psroa$p016$p0=Lsign$p0;
		}
		Lagg$presult[Magg$presult]=L$psroa$p517$p0;
		Lagg$presult[Magg$presult+1|0]=L$psroa$p016$p0;
		return;
	}
	var __root =
		typeof self === 'object' && self.self === self && self ||
		typeof global === 'object' && global.global === global && global ||
		this;
	__root.add64 = add64;
	__root.sub64 = sub64;
	__root.mul64 = mul64;
	__root.sdiv64 = sdiv64;
	__root.srem64 = srem64;
})();
